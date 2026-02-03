import asyncio
import os
import uuid
import edge_tts
from datetime import datetime

# 音频存储目录
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# 中文语音映射（Edge TTS 支持的语音）
VOICE_MAP = {
    "女性": {
        "zh-CN": "zh-CN-XiaoxiaoNeural",  # 晓晓 - 温柔女声
        "zh-TW": "zh-TW-HsiaoYuNeural",
        "hongkong": "zh-HK-HiuGaaiNeural",
    },
    "男性": {
        "zh-CN": "zh-CN-YunxiNeural",  # 云希 - 磁性男声
        "zh-TW": "zh-TW-YunJheNeural",
        "hongkong": "zh-HK-HiuWaiNeural",
    },
}

# 备用语音列表
FALLBACK_VOICES = [
    "zh-CN-XiaoxiaoNeural",
    "zh-CN-YunxiNeural",
    "zh-CN-YunyangNeural",
    "zh-CN-XiaoyouNeural",
]


async def text_to_speech(text: str, gender: str = "女性", language: str = "zh-CN") -> str:
    """
    将文本转换为语音，返回音频文件路径

    Args:
        text: 要转换的文本
        gender: 性别
        language: 语言

    Returns:
        音频文件路径
    """
    # 选择语音
    voice = VOICE_MAP.get(gender, {}).get(language, VOICE_MAP["女性"]["zh-CN"])

    # 生成唯一文件名
    audio_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    audio_filename = f"{timestamp}_{audio_id}.mp3"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)

    # 限制文本长度（防止过长）
    max_length = 500
    if len(text) > max_length:
        text = text[:max_length] + "..."

    # 尝试使用指定语音，如果失败则使用备用
    communication = edge_tts.Communicate(text, voice)

    try:
        await communication.save(audio_path)
    except Exception as e:
        # 尝试备用语音
        for fallback_voice in FALLBACK_VOICES:
            try:
                communication = edge_tts.Communicate(text, fallback_voice)
                await communication.save(audio_path)
                break
            except Exception:
                continue
        else:
            raise Exception(f"语音合成失败: {str(e)}")

    # 返回相对路径（用于 URL）
    return f"/audio/{audio_filename}"


async def get_voice_list():
    """获取可用的语音列表"""
    try:
        voices = await edge_tts.list_voices()
        # 过滤中文语音
        zh_voices = [
            v["ShortName"]
            for v in voices
            if v["Locale"].startswith("zh")
        ]
        return zh_voices
    except Exception:
        return FALLBACK_VOICES

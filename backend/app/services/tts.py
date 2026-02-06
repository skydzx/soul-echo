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

# 语音描述（用于UI展示）
VOICE_DESCRIPTIONS = {
    "zh-CN-XiaoxiaoNeural": "晓晓 - 温柔甜美女声",
    "zh-CN-XiaoxiaoNeural-4": "晓晓 - 自然生动女声",
    "zh-CN-XiaoyanNeural": "晓颜 - 知性女声",
    "zh-CN-XiaoshuangNeural": "晓双 - 活泼女声",
    "zh-CN-YunxiNeural": "云希 - 磁性男声",
    "zh-CN-YunxiNeural-3": "云希 - 深情男声",
    "zh-CN-YunyangNeural": "云扬 - 专业男声",
    "zh-CN-YunyouNeural": "云悠 - 悠扬童声",
    "zh-CN-XiaoyouNeural": "晓悠 - 可爱童声",
    "zh-TW-HsiaoYuNeural": "晓瑜 - 台湾女声",
    "zh-TW-YunJheNeural": "云哲 - 台湾男声",
    "zh-HK-HiuGaaiNeural": "晓悦 - 香港女声",
    "zh-HK-HiuWaiNeural": "晓薇 - 香港女声",
}

# 语音情感风格
VOICE_STYLES = {
    "zh-CN-XiaoxiaoNeural": ["聊天", "客户服务", "阅读", "热情", "伤心"],
    "zh-CN-XiaoxiaoNeural-4": ["通用", "聊天", "积极", "冷静"],
    "zh-CN-YunxiNeural": ["聊天", "客户服务", "阅读", "悲伤", "不满"],
    "zh-CN-YunxiNeural-3": ["通用", "抒情", "浪漫", "深情"],
}


async def text_to_speech(
    text: str,
    gender: str = "女性",
    language: str = "zh-CN",
    voice: str = None,
    rate: str = "+0%",
    volume: str = "+0%",
    pitch: str = "+0Hz"
) -> str:
    """
    将文本转换为语音，返回音频文件路径

    Args:
        text: 要转换的文本
        gender: 性别
        language: 语言
        voice: 指定具体语音（可选）
        rate: 语速，如 "+0%", "+10%"
        volume: 音量，如 "+0%", "+10%"
        pitch: 音调，如 "+0Hz", "+10Hz"

    Returns:
        音频文件路径
    """
    # 选择语音
    if voice and voice.strip():
        selected_voice = voice
    else:
        selected_voice = VOICE_MAP.get(gender, {}).get(language, VOICE_MAP["女性"]["zh-CN"])

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
    try:
        communication = edge_tts.Communicate(
            text,
            selected_voice,
            rate=rate,
            volume=volume,
            pitch=pitch
        )
        await communication.save(audio_path)
    except Exception as e:
        print(f"语音合成失败，使用备用语音: {e}")
        # 尝试备用语音
        for fallback_voice in FALLBACK_VOICES:
            try:
                communication = edge_tts.Communicate(
                    text,
                    fallback_voice,
                    rate=rate,
                    volume=volume,
                    pitch=pitch
                )
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

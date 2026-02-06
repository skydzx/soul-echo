from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter()

# 创建 audio 静态文件目录
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    gender: str = "女性"
    language: str = "zh-CN"
    voice: Optional[str] = None  # 指定具体语音
    rate: Optional[str] = "+0%"  # 语速
    volume: Optional[str] = "+0%"  # 音量
    pitch: Optional[str] = "+0Hz"  # 音调


class TTSResponse(BaseModel):
    audio_url: str
    text: str


class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str
    description: str
    locale: str
    styles: List[str] = []


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """文本转语音"""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="文本不能为空")

    if len(request.text) > 1000:
        raise HTTPException(status_code=400, detail="文本长度不能超过1000字符")

    try:
        from app.services.tts import text_to_speech as tts_func

        audio_url = await tts_func(
            text=request.text.strip(),
            gender=request.gender,
            language=request.language,
            voice=request.voice,
            rate=request.rate,
            volume=request.volume,
            pitch=request.pitch,
        )

        return TTSResponse(
            audio_url=audio_url,
            text=request.text.strip(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音合成失败: {str(e)}")


@router.get("/tts/voices")
async def get_available_voices():
    """获取可用的语音列表"""
    try:
        from app.services.tts import get_voice_list, VOICE_DESCRIPTIONS, VOICE_STYLES

        voices = await get_voice_list()

        # 构建语音信息列表
        voice_info_list = []
        for voice_id in voices:
            gender = "女性" if "Female" in voice_id or "Xiaoxiao" in voice_id or "Xiaoyan" in voice_id or "Xiaoshuang" in voice_id or "Xiaoyou" in voice_id else "男性"

            voice_info_list.append({
                "id": voice_id,
                "name": VOICE_DESCRIPTIONS.get(voice_id, voice_id),
                "gender": gender,
                "description": VOICE_DESCRIPTIONS.get(voice_id, ""),
                "locale": voice_id.split("-")[1] if "-" in voice_id else "zh-CN",
                "styles": VOICE_STYLES.get(voice_id, []),
            })

        return {"voices": voice_info_list}
    except Exception as e:
        return {"voices": [], "error": str(e)}


@router.get("/tts/voices/recommended")
async def get_recommended_voices():
    """获取推荐的语音列表"""
    recommended = [
        {
            "id": "zh-CN-XiaoxiaoNeural",
            "name": "晓晓",
            "gender": "女性",
            "description": "温柔甜美女声，最适合聊天",
            "use_case": "日常聊天、倾诉",
        },
        {
            "id": "zh-CN-YunxiNeural",
            "name": "云希",
            "gender": "男性",
            "description": "磁性低沉男声，温暖治愈",
            "use_case": "恋爱陪伴、暧昧对话",
        },
        {
            "id": "zh-CN-XiaoyanNeural",
            "name": "晓颜",
            "gender": "女性",
            "description": "知性成熟女声",
            "use_case": "知心姐姐、职场建议",
        },
        {
            "id": "zh-CN-XiaoyouNeural",
            "name": "晓悠",
            "gender": "女性",
            "description": "活泼可爱童声",
            "use_case": "可爱角色、萌系对话",
        },
    ]
    return {"voices": recommended}

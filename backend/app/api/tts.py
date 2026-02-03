from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter()

# 创建 audio 静态文件目录
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    gender: str = "女性"
    language: str = "zh-CN"


class TTSResponse(BaseModel):
    audio_url: str
    text: str


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
        from app.services.tts import get_voice_list

        voices = await get_voice_list()
        return {"voices": voices}
    except Exception as e:
        return {"voices": [], "error": str(e)}

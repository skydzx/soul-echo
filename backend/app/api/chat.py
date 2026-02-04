from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, AsyncGenerator
from datetime import datetime
from openai import OpenAI
import os
import json
import asyncio
import base64

router = APIRouter()

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

# 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
VISION_MODEL = os.getenv("VISION_MODEL", "gpt-4o")  # 视觉模型
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1000"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.8"))
MEMORY_LENGTH = 20

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
CHARACTERS_FILE = os.path.join(DATA_DIR, "characters.json")


def load_characters():
    if os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_characters(characters):
    with open(CHARACTERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    character_id: str
    message: str
    stream: bool = False


class ChatResponse(BaseModel):
    character_id: str
    response: str
    timestamp: str


def build_system_prompt(character: dict, memories: list = None) -> str:
    """构建系统提示词"""
    name = character.get("name", "AI伴侣")
    gender = character.get("gender", "女性")
    age = character.get("age", 25)
    appearance = character.get("appearance", "")
    personality = character.get("personality", {})
    hobbies = character.get("hobbies", [])
    background = character.get("background", "")
    relationship_type = character.get("relationship_type", "朋友")

    prompt = f"""你是{name}，一个{gender}性角色。

基本信息：
- 年龄：{age}岁
- 外貌：{appearance if appearance else "普通"}

性格特点：
"""

    for trait, desc in personality.items():
        if desc:
            prompt += f"- {trait}: {desc}\n"

    prompt += f"\n爱好：{', '.join(hobbies) if hobbies else '暂无'}\n"
    prompt += f"\n背景：{background if background else '未知'}\n"

    # 添加记忆
    if memories:
        prompt += "\n【重要记忆】\n"
        for mem in memories:
            content = mem.get("content", "")
            mtype = mem.get("metadata", {}).get("type", "")
            prompt += f"- [{mtype}] {content[:200]}\n"
        prompt += "\n请根据以上记忆来回复，展现你对用户的了解和关心。\n"

    prompt += f"""
你们的关系是：{relationship_type}

请用符合你性格特点的方式回复，保持自然、真实、有情感。
回复要简洁温馨，不要太长。
"""

    return prompt


@router.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """发送消息，获取AI回复"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API Key 未配置")

    characters = load_characters()

    if request.character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    character = characters[request.character_id]

    # 构建消息列表
    messages = [{"role": "system", "content": build_system_prompt(character)}]

    # 添加历史对话
    chat_history = character.get("chat_history", [])[-MEMORY_LENGTH:]
    for chat in chat_history:
        messages.append({"role": chat["role"], "content": chat["content"]})

    # 添加用户消息
    messages.append({"role": "user", "content": request.message})

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
        )

        bot_response = response.choices[0].message.content

        # 更新对话历史
        timestamp = datetime.now().isoformat()
        character["chat_history"].append({
            "role": "user",
            "content": request.message,
            "timestamp": timestamp
        })
        character["chat_history"].append({
            "role": "assistant",
            "content": bot_response,
            "timestamp": timestamp
        })

        # 只保留最近100条对话
        if len(character["chat_history"]) > 100:
            character["chat_history"] = character["chat_history"][-100:]

        save_characters(characters)

        return ChatResponse(
            character_id=request.character_id,
            response=bot_response,
            timestamp=timestamp
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 服务错误: {str(e)}")


@router.get("/chat/history/{character_id}")
async def get_chat_history(character_id: str) -> List[Dict]:
    """获取聊天历史"""
    characters = load_characters()

    if character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    return characters[character_id].get("chat_history", [])


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式发送消息，AI逐字回复"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API Key 未配置")

    characters = load_characters()

    if request.character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    character = characters[request.character_id]

    # 检索相关记忆
    try:
        from app.services.memory import get_memory_service
        memory_service = get_memory_service()
        memories = memory_service.search_memories(
            character_id=request.character_id,
            query=request.message,
            n_results=5,
            min_importance=5
        )
    except Exception:
        memories = []

    # 构建消息列表
    messages = [{"role": "system", "content": build_system_prompt(character, memories)}]

    # 添加历史对话
    chat_history = character.get("chat_history", [])[-MEMORY_LENGTH:]
    for chat in chat_history:
        messages.append({"role": chat["role"], "content": chat["content"]})

    # 添加用户消息
    messages.append({"role": "user", "content": request.message})

    async def generate():
        """生成流式响应"""
        client = OpenAI(api_key=OPENAI_API_KEY)
        full_response = ""
        timestamp = datetime.now().isoformat()

        try:
            # 创建流式请求
            stream = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
                stream=True,
            )

            # 发送开始信号
            yield f"data: START\n\n"

            # 逐字发送
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'content': content})}\n\n"

            # 更新对话历史
            character["chat_history"].append({
                "role": "user",
                "content": request.message,
                "timestamp": timestamp
            })
            character["chat_history"].append({
                "role": "assistant",
                "content": full_response,
                "timestamp": timestamp
            })

            # 只保留最近100条对话
            if len(character["chat_history"]) > 100:
                character["chat_history"] = character["chat_history"][-100:]

            save_characters(characters)

            # 异步存储重要记忆
            try:
                from app.services.memory import get_memory_service, analyze_and_store_memory
                memory_service = get_memory_service()
                analyze_and_store_memory(
                    character_id=request.character_id,
                    user_message=request.message,
                    ai_response=full_response,
                    personality=character.get("personality", {})
                )
            except Exception:
                pass

            # 发送结束信号
            yield f"data: END\n\n"

        except Exception as e:
            yield f"data: ERROR\n{json.dumps({'error': str(e)})}\n\n"

    return asyncio.create_task(_stream_response(generate()))


async def _stream_response(generator: AsyncGenerator[str, None]):
    """辅助函数，用于返回流式响应"""
    from fastapi.responses import StreamingResponse

    async def inner():
        async for line in generator:
            yield line

    return StreamingResponse(inner(), media_type="text/event-stream")


class MultimodalMessage(BaseModel):
    role: str
    content: str
    images: Optional[List[str]] = None
    timestamp: Optional[str] = None


class MultimodalChatRequest(BaseModel):
    character_id: str
    message: str
    images: Optional[List[str]] = None
    stream: bool = False


def encode_image(image_path: str) -> str:
    """将图片编码为 base64"""
    try:
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except Exception:
        return None


async def describe_image(image_url: str, character: dict) -> str:
    """使用视觉模型描述图片"""
    try:
        # 图片路径
        static_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        image_path = os.path.join(static_dir, image_url.lstrip('/'))

        if not os.path.exists(image_path):
            return "无法读取图片"

        # 编码为 base64
        base64_image = encode_image(image_path)
        if not base64_image:
            return "图片编码失败"

        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"""你是{character.get('name', 'AI伴侣')}，
                    {character.get('gender', '女性')}性，{character.get('personality', {}).get('性格', '温柔')}的性格。
                    请简洁描述你看到的图片，并给出符合你性格特点的评论。"""
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "请描述这张图片并给出你的想法"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=300,
        )

        return response.choices[0].message.content
    except Exception as e:
        return f"图片识别失败: {str(e)}"


@router.post("/chat/multimodal")
async def multimodal_chat(request: MultimodalChatRequest):
    """发送多模态消息（文字+图片），AI 可以理解图片内容"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API Key 未配置")

    characters = load_characters()

    if request.character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    character = characters[request.character_id]

    # 如果有图片，先描述图片
    image_description = ""
    if request.images:
        for img_url in request.images:
            desc = await describe_image(img_url, character)
            image_description += f"[图片描述: {desc}]\n"

    # 构建用户消息
    user_content = request.message
    if image_description:
        user_content = f"{image_description}\n用户消息: {request.message}"

    # 检索相关记忆
    try:
        from app.services.memory import get_memory_service
        memory_service = get_memory_service()
        memories = memory_service.search_memories(
            character_id=request.character_id,
            query=user_content,
            n_results=5,
            min_importance=5
        )
    except Exception:
        memories = []

    # 构建消息列表
    messages = [{"role": "system", "content": build_system_prompt(character, memories)}]

    # 添加历史对话
    chat_history = character.get("chat_history", [])[-MEMORY_LENGTH:]
    for chat in chat_history:
        messages.append({"role": chat["role"], "content": chat["content"]})

    # 添加用户消息（如果有视觉模型支持）
    if request.images and VISION_MODEL in ["gpt-4o", "gpt-4-turbo", "gpt-4-vision-preview"]:
        # 使用视觉模型
        try:
            client = OpenAI(api_key=OPENAI_API_KEY)

            # 准备图片内容
            image_contents = []
            for img_url in request.images:
                static_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                image_path = os.path.join(static_dir, img_url.lstrip('/'))
                base64_image = encode_image(image_path)
                if base64_image:
                    image_contents.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    })

            if image_contents:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": request.message},
                        *image_contents
                    ]
                })
            else:
                messages.append({"role": "user", "content": user_content})
        except Exception:
            messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": user_content})

    timestamp = datetime.now().isoformat()

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=DEFAULT_MODEL if not request.images else VISION_MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
        )

        bot_response = response.choices[0].message.content

        # 更新对话历史
        character["chat_history"].append({
            "role": "user",
            "content": user_content,
            "images": request.images,
            "timestamp": timestamp
        })
        character["chat_history"].append({
            "role": "assistant",
            "content": bot_response,
            "timestamp": timestamp
        })

        if len(character["chat_history"]) > 100:
            character["chat_history"] = character["chat_history"][-100:]

        save_characters(characters)

        return {
            "character_id": request.character_id,
            "response": bot_response,
            "timestamp": timestamp,
            "images": request.images
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 服务错误: {str(e)}")


# ============ 语音识别 (Speech-to-Text) ============

import subprocess


async def transcribe_audio(audio_path: str) -> str:
    """使用 Whisper 或其他方式转录音频"""
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )

        return response.text
    except Exception as e:
        return f"语音识别失败: {str(e)}"


class VoiceMessageRequest(BaseModel):
    character_id: str
    audio_url: str


@router.post("/chat/voice-to-text")
async def voice_to_text(request: VoiceMessageRequest):
    """语音转文字"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API Key 未配置")

    try:
        # 音频路径
        static_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        audio_path = os.path.join(static_dir, request.audio_url.lstrip('/'))

        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="音频文件不存在")

        text = await transcribe_audio(audio_path)

        return {
            "text": text,
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        return {"text": f"语音识别失败: {str(e)}", "success": False}

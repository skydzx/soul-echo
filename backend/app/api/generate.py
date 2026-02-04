from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json

router = APIRouter()


class GenerateRequest(BaseModel):
    gender: str = "女性"
    relationship_type: str = "恋人"
    preferences: str = ""  # 用户对伴侣的描述或偏好


class GenerateNameResponse(BaseModel):
    names: list[str]
    reasons: list[str]  # 每个名字的含义/来源


class GenerateAppearanceResponse(BaseModel):
    appearance: str
    style_tips: list[str]  # 穿搭风格建议


def get_openai_client():
    """获取 OpenAI 客户端，如果没配置 API key 则返回 None"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    from openai import OpenAI
    return OpenAI(api_key=api_key)


@router.post("/generate/name", response_model=GenerateNameResponse)
async def generate_name(request: GenerateRequest):
    """AI 生成符合中国习惯的角色名字"""
    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=503, detail="未配置 OpenAI API Key，无法使用 AI 生成功能")

    prompt = f"""
你是一个取名专家。根据以下信息生成5个适合的中文名字：

- 性别：{request.gender}
- 关系类型：{request.relationship_type}
- 用户偏好：{request.preferences if request.preferences else '无特别偏好'}
- 风格：优雅、亲切、有特色

要求：
1. 名字要符合中国习惯，好听好记
2. 可以包含生僻字但要保证常用
3. 2-3个字的名字都要有
4. 不要太大众化也不要太奇怪

请以JSON格式返回，格式如下：
{{
    "names": ["名字1", "名字2", "名字3", "名字4", "名字5"],
    "reasons": ["含义/来源1", "含义/来源2", "含义/来源3", "含义/来源4", "含义/来源5"]
}}
"""

    response = client.chat.completions.create(
        model=os.getenv("MODEL_NAME", "gpt-3.5-turbo"),
        messages=[
            {
                "role": "system",
                "content": "你是一个专业的取名专家，擅长根据用户的描述生成合适的中文人名。回答必须严格是JSON格式，不要有任何其他文字。"
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
    )

    content = response.choices[0].message.content
    # 清理可能的markdown格式
    content = content.replace("```json", "").replace("```", "").strip()

    result = json.loads(content)
    return GenerateNameResponse(**result)


@router.post("/generate/appearance", response_model=GenerateAppearanceResponse)
async def generate_appearance(request: GenerateRequest):
    """AI 生成外貌特征描述"""
    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=503, detail="未配置 OpenAI API Key，无法使用 AI 生成功能")

    prompt = f"""
根据以下信息生成一个详细且真实的外貌特征描述：

- 性别：{request.gender}
- 关系类型：{request.relationship_type}
- 性格特点偏好：{request.preferences if request.preferences else '自然真实'}
- 风格：真实感、校园/日常风格

要求：
1. 描述要真实自然，像是在描述一个真实的人
2. 避免过度美化或太科幻的描述
3. 包含：面部特征、发型、身材、穿搭风格
4. 2-4个细节即可，不要太长
5. 语言简洁，像是朋友描述一样

请以JSON格式返回，格式如下：
{{
    "appearance": "详细的外貌描述，2-3句话",
    "style_tips": ["穿搭建议1", "穿搭建议2", "穿搭建议3"]
}}
"""

    response = client.chat.completions.create(
        model=os.getenv("MODEL_NAME", "gpt-3.5-turbo"),
        messages=[
            {
                "role": "system",
                "content": "你是一个描述人物外貌的专家，擅长根据人物特点生成真实自然的外貌描述。回答必须严格是JSON格式，不要有任何其他文字。"
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
    )

    content = response.choices[0].message.content
    content = content.replace("```json", "").replace("```", "").strip()

    result = json.loads(content)
    return GenerateAppearanceResponse(**result)

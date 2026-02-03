from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from uuid import uuid4
from datetime import datetime
import json
import os

router = APIRouter()

# 数据存储
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
CHARACTERS_FILE = os.path.join(DATA_DIR, "characters.json")


def load_characters():
    """加载角色数据"""
    if os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_characters(characters):
    """保存角色数据"""
    with open(CHARACTERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)


# Pydantic 模型
class PersonalityModel(BaseModel):
    性格: str = "温柔体贴"
    说话风格: str = "温柔型"
    情绪: str = "丰富多变"
    兴趣: List[str] = []


class CharacterCreate(BaseModel):
    name: str
    gender: str = "女性"
    age: int = 22
    appearance: str = ""
    personality: PersonalityModel = PersonalityModel()
    hobbies: List[str] = []
    background: str = ""
    relationship_type: str = "朋友"


class CharacterResponse(BaseModel):
    id: str
    name: str
    gender: str
    age: int
    appearance: str
    personality: Dict
    hobbies: List[str]
    background: str
    relationship_type: str
    created_at: str
    avatar: Optional[str] = None


@router.get("/characters")
async def get_characters() -> List[CharacterResponse]:
    """获取所有角色"""
    characters = load_characters()
    return [CharacterResponse(**char_data) for char_data in characters.values()]


@router.get("/characters/{character_id}")
async def get_character(character_id: str) -> CharacterResponse:
    """获取单个角色详情"""
    characters = load_characters()
    if character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")
    return CharacterResponse(**characters[character_id])


@router.post("/characters")
async def create_character(character: CharacterCreate) -> CharacterResponse:
    """创建新角色"""
    characters = load_characters()

    character_id = str(uuid4())
    now = datetime.now().isoformat()

    char_data = {
        "id": character_id,
        "name": character.name,
        "gender": character.gender,
        "age": character.age,
        "appearance": character.appearance,
        "personality": character.personality.model_dump(),
        "hobbies": character.hobbies,
        "background": character.background,
        "relationship_type": character.relationship_type,
        "created_at": now,
        "chat_history": [],
        "memories": []
    }

    characters[character_id] = char_data
    save_characters(characters)

    return CharacterResponse(**char_data)


@router.delete("/characters/{character_id}")
async def delete_character(character_id: str):
    """删除角色"""
    characters = load_characters()

    if character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    del characters[character_id]
    save_characters(characters)

    return {"message": "删除成功"}

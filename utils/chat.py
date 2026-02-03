import streamlit as st
import uuid
import json
import os
from datetime import datetime
from config import *

# 确保目录存在
os.makedirs(CHARACTERS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


class CharacterManager:
    """角色管理器"""

    def __init__(self):
        self.characters_file = os.path.join(DATA_DIR, "characters.json")
        self.load_characters()

    def load_characters(self):
        """加载所有角色"""
        if os.path.exists(self.characters_file):
            with open(self.characters_file, 'r', encoding='utf-8') as f:
                self.characters = json.load(f)
        else:
            self.characters = {}

    def save_characters(self):
        """保存角色列表"""
        with open(self.characters_file, 'w', encoding='utf-8') as f:
            json.dump(self.characters, f, ensure_ascii=False, indent=2)

    def create_character(self, name, gender, age, appearance, personality,
                         hobbies, background, relationship_type):
        """创建新角色"""
        character_id = str(uuid.uuid4())

        character = {
            "id": character_id,
            "name": name,
            "gender": gender,
            "age": age,
            "appearance": appearance,
            "personality": personality,
            "hobbies": hobbies,
            "background": background,
            "relationship_type": relationship_type,
            "created_at": datetime.now().isoformat(),
            "chat_history": [],
            "memories": []
        }

        self.characters[character_id] = character
        self.save_characters()
        return character_id

    def get_character(self, character_id):
        """获取角色信息"""
        return self.characters.get(character_id)

    def get_all_characters(self):
        """获取所有角色"""
        return list(self.characters.values())

    def delete_character(self, character_id):
        """删除角色"""
        if character_id in self.characters:
            del self.characters[character_id]
            self.save_characters()

    def update_chat(self, character_id, role, message):
        """更新对话历史"""
        if character_id in self.characters:
            self.characters[character_id]["chat_history"].append({
                "role": role,
                "content": message,
                "timestamp": datetime.now().isoformat()
            })

    def add_memory(self, character_id, memory):
        """添加重要记忆"""
        if character_id in self.characters:
            self.characters[character_id]["memories"].append({
                "content": memory,
                "timestamp": datetime.now().isoformat()
            })


class ChatBot:
    """AI对话引擎"""

    def __init__(self, api_key):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)

    def generate_response(self, character, user_message):
        """生成回复"""
        # 构建系统提示
        system_prompt = self._build_system_prompt(character)

        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]

        # 添加历史对话
        chat_history = character.get("chat_history", [])[-MEMORY_LENGTH:]
        for chat in chat_history:
            messages.append({"role": chat["role"], "content": chat["content"]})

        # 添加用户消息
        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
            )

            return response.choices[0].message.content
        except Exception as e:
            return f"抱歉，出了点问题: {str(e)}"

    def _build_system_prompt(self, character):
        """构建系统提示词"""
        relationship_type = character.get("relationship_type", "朋友")
        name = character.get("name", "AI伴侣")
        personality = character.get("personality", {})
        hobbies = character.get("hobbies", [])
        background = character.get("background", "")

        prompt = f"""你是{name}，一个{character.get('gender', '女性')}性角色。

你的基本信息：
- 年龄：{character.get('age', 25)}岁
- 外貌：{character.get('appearance', '普通')}

性格特点：
"""
        for trait, desc in personality.items():
            if desc:
                prompt += f"- {trait}: {desc}\n"

        prompt += f"\n爱好：{', '.join(hobbies) if hobbies else '暂无'}\n"
        prompt += f"\n背景：{background}\n"

        prompt += f"""
你们的关系是：{relationship_type}

请用符合你性格特点的方式回复，保持自然、真实、有情感。
回复要简洁温馨，不要太长。
"""

        return prompt


# 初始化管理器
@st.cache_resource
def get_character_manager():
    return CharacterManager()

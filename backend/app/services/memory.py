import os
import uuid
import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import chromadb
from chromadb.config import Settings
import numpy as np

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

# 存储目录
DATA_DIR = "data"
MEMORY_DIR = os.path.join(DATA_DIR, "memory")
os.makedirs(MEMORY_DIR, exist_ok=True)

# ChromaDB 数据目录
CHROMA_DIR = os.path.join(MEMORY_DIR, "chroma")
os.makedirs(CHROMA_DIR, exist_ok=True)


# 记忆类型定义
MEMORY_TYPES = [
    "生日", "喜好", "厌恶", "梦想", "工作", "学校",
    "爱好", "习惯", "基本信息", "位置", "关系",
    "重要事件", "情感", "日常"
]


class MemoryService:
    """长期记忆服务"""

    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.collections: Dict[str, chromadb.Collection] = {}

    def get_collection(self, character_id: str) -> chromadb.Collection:
        """获取角色的记忆集合"""
        if character_id not in self.collections:
            try:
                collection_name = f"memory_{character_id}"
                self.collections[character_id] = self.client.get_or_create_collection(
                    name=collection_name,
                    metadata={"character_id": character_id}
                )
            except Exception as e:
                print(f"创建记忆集合失败: {e}")
                # 尝试删除旧集合
                try:
                    self.client.delete_collection(collection_name)
                    self.collections[character_id] = self.client.create_collection(
                        name=collection_name,
                        metadata={"character_id": character_id}
                    )
                except Exception:
                    # 如果还是失败，创建一个内存集合
                    self.collections[character_id] = self.client.create_collection(
                        name=collection_name + "_backup",
                        metadata={"character_id": character_id}
                    )

        return self.collections[character_id]

    def add_memory(
        self,
        character_id: str,
        content: str,
        memory_type: str = "对话",
        importance: int = 5,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        添加记忆

        Args:
            character_id: 角色ID
            content: 记忆内容
            memory_type: 记忆类型（对话、重要事件、偏好、习惯等）
            importance: 重要性 1-10
            metadata: 额外元数据

        Returns:
            记忆ID
        """
        try:
            collection = self.get_collection(character_id)
            memory_id = str(uuid.uuid4())

            # 元数据
            meta = {
                "type": memory_type,
                "importance": importance,
                "created_at": datetime.now().isoformat(),
                **(metadata or {})
            }

            collection.add(
                documents=[content],
                metadatas=[meta],
                ids=[memory_id]
            )

            return memory_id
        except Exception as e:
            print(f"添加记忆失败: {e}")
            return ""

    def search_memories(
        self,
        character_id: str,
        query: str,
        n_results: int = 5,
        min_importance: int = 0
    ) -> List[Dict]:
        """
        搜索相关记忆

        Args:
            character_id: 角色ID
            query: 查询内容
            n_results: 返回数量
            min_importance: 最小重要性

        Returns:
            相关记忆列表
        """
        try:
            collection = self.get_collection(character_id)

            # 搜索记忆
            results = collection.query(
                query_texts=[query],
                n_results=min(n_results * 2, 20),  # 获取更多结果以便过滤
                where={"importance": {"$gte": min_importance}}
            )

            memories = []
            if results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    memories.append({
                        "id": results['ids'][0][i],
                        "content": doc,
                        "metadata": results['metadatas'][0][i] if results['metadatas'][0] else {},
                        "distance": results['distances'][0][i] if results['distances'][0] else None
                    })

            # 按重要性排序
            memories.sort(key=lambda x: x['metadata'].get('importance', 0), reverse=True)

            return memories[:n_results]

        except Exception as e:
            print(f"搜索记忆失败: {e}")
            return []

    def get_important_memories(
        self,
        character_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """获取最重要的记忆"""
        try:
            collection = self.get_collection(character_id)

            results = collection.get(
                where={"importance": {"$gte": 7}},
                limit=limit
            )

            memories = []
            if results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents']):
                    memories.append({
                        "id": results['ids'][i],
                        "content": doc,
                        "metadata": results['metadatas'][i] if results['metadatas'][i] else {}
                    })

            return memories

        except Exception as e:
            print(f"获取重要记忆失败: {e}")
            return []

    def delete_memory(self, character_id: str, memory_id: str) -> bool:
        """删除记忆"""
        try:
            collection = self.get_collection(character_id)
            collection.delete(ids=[memory_id])
            return True
        except Exception as e:
            print(f"删除记忆失败: {e}")
            return False

    def get_memory_count(self, character_id: str) -> int:
        """获取记忆数量"""
        try:
            collection = self.get_collection(character_id)
            return collection.count()
        except Exception:
            return 0

    def clear_all_memories(self, character_id: str) -> bool:
        """清除所有记忆"""
        try:
            if character_id in self.collections:
                del self.collections[character_id]

            collection_name = f"memory_{character_id}"
            self.client.delete_collection(collection_name)
            return True
        except Exception as e:
            print(f"清除记忆失败: {e}")
            return False


# 单例实例
_memory_service: Optional[MemoryService] = None


def get_memory_service() -> MemoryService:
    """获取记忆服务单例"""
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service


def _analyze_with_ai(user_message: str, ai_response: str, personality: Dict) -> List[Dict]:
    """
    使用 AI 分析对话，提取重要记忆

    Returns:
        List of memory dicts with keys: content, memory_type, importance
    """
    import openai

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # 如果没有 API key，返回空列表，使用关键词回退
        return []

    client = openai.OpenAI(api_key=api_key)

    personality_str = ", ".join([f"{k}: {v}" for k, v in personality.items() if v])

    prompt = f"""你是一个记忆分析专家。从以下对话中提取重要信息，生成结构化的记忆。

对话上下文（角色性格）：
{personality_str}

对话内容：
用户: {user_message}
助手: {ai_response}

请分析对话，提取以下类型的重要信息：
1. 用户的个人喜好（喜欢什么、讨厌什么）
2. 重要事件或里程碑
3. 用户分享的日常生活细节
4. 关系和情感相关的互动
5. 用户的梦想、目标、计划
6. 重要的日期（生日、纪念日等）
7. 习惯和行为模式

要求：
1. 提取的记忆应该是简洁、具体的句子
2. 每个记忆要标注类型和重要性(1-10)
3. 只提取真正重要的信息，避免冗余
4. 记忆应该能帮助助手更好地了解用户

请以JSON数组格式返回，示例：
[
  {{"content": "用户喜欢蓝色", "type": "喜好", "importance": 7}},
  {{"content": "用户说下周要去旅行", "type": "计划", "importance": 5}}
]

如果对话中没有重要信息，返回空数组 []。
"""

    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "gpt-3.5-turbo"),
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的记忆分析助手，擅长从对话中提取有价值的信息。你的回答必须是有效的JSON格式，不要添加任何其他文字。"
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        content = response.choices[0].message.content
        # 清理可能的markdown格式
        content = content.replace("```json", "").replace("```", "").strip()

        memories = json.loads(content)
        return memories if isinstance(memories, list) else []

    except Exception as e:
        print(f"AI分析记忆失败: {e}")
        return []


def _keyword_fallback_analyze(user_message: str, ai_response: str) -> List[Dict]:
    """关键词回退分析（当 AI 不可用时）"""
    message_combined = (user_message + " " + ai_response).lower()
    memories = []

    keyword_rules = [
        (r"生日", "生日", 9),
        (r"喜欢|爱", "喜好", 7),
        (r"讨厌|不喜欢", "厌恶", 7),
        (r"梦想|希望|想.*成为", "梦想", 8),
        (r"工作|上班|公司", "工作", 5),
        (r"学校|上学|上课|考试", "学校", 5),
        (r"爱好|喜欢.*玩|喜欢.*看", "爱好", 6),
        (r"习惯|总是|经常", "习惯", 5),
        (r"今天|昨天|明天|周末|下周", "日常", 4),
        (r"旅行|旅游|去.*玩", "计划", 5),
        (r"难过|开心|生气|兴奋|焦虑", "情感", 6),
    ]

    for pattern, mem_type, importance in keyword_rules:
        import re
        if re.search(pattern, message_combined):
            # 提取包含关键词的上下文句子
            sentences = re.split(r'[。！？\n]', message_combined)
            for sent in sentences:
                if re.search(pattern, sent) and len(sent) > 5:
                    memories.append({
                        "content": sent.strip()[:200],
                        "type": mem_type,
                        "importance": importance
                    })
                    break

    return memories


def analyze_and_store_memory(
    character_id: str,
    user_message: str,
    ai_response: str,
    personality: Dict
) -> List[str]:
    """
    分析对话并存储重要记忆

    返回存储的记忆ID列表
    """
    memory_service = get_memory_service()

    # 先尝试 AI 分析
    ai_memories = _analyze_with_ai(user_message, ai_response, personality)

    memories_to_store = []

    if ai_memories:
        memories_to_store = ai_memories
    else:
        # 回退到关键词分析
        memories_to_store = _keyword_fallback_analyze(user_message, ai_response)

    # 存储记忆
    memory_ids = []
    for mem in memories_to_store:
        # 检查是否已存在相似记忆
        existing = memory_service.search_memories(
            character_id=character_id,
            query=mem["content"],
            n_results=1,
            min_importance=5
        )

        # 如果没有相似的记忆，才添加
        if not existing or existing[0].get("distance", 1) > 0.5:
            memory_id = memory_service.add_memory(
                character_id=character_id,
                content=mem["content"],
                memory_type=mem.get("type", "对话"),
                importance=min(mem.get("importance", 5), 10)
            )
            if memory_id:
                memory_ids.append(memory_id)

    return memory_ids


def consolidate_memories(character_id: str) -> int:
    """
    合并相似的记忆

    Returns:
        合并后删除的记忆数量
    """
    memory_service = get_memory_service()

    try:
        # 获取所有记忆
        all_memories = memory_service.get_important_memories(character_id, limit=100)

        deleted_count = 0
        checked = set()

        for mem in all_memories:
            mem_id = mem.get("id")
            if mem_id in checked:
                continue

            checked.add(mem_id)

            # 搜索相似的记忆
            similar = memory_service.search_memories(
                character_id=character_id,
                query=mem["content"],
                n_results=5,
                min_importance=0
            )

            for similar_mem in similar:
                sim_id = similar_mem.get("id")
                if sim_id == mem_id or sim_id in checked:
                    continue

                # 如果相似度很高（距离小于0.3），删除相似记忆
                if similar_mem.get("distance", 1) < 0.3:
                    # 保留重要性更高的
                    if similar_mem.get("metadata", {}).get("importance", 0) <= mem.get("metadata", {}).get("importance", 0):
                        if memory_service.delete_memory(character_id, sim_id):
                            deleted_count += 1
                            checked.add(sim_id)

        return deleted_count

    except Exception as e:
        print(f"合并记忆失败: {e}")
        return 0

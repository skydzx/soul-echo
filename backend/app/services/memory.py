import os
import uuid
import json
from datetime import datetime
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings
import numpy as np

# 存储目录
DATA_DIR = "data"
MEMORY_DIR = os.path.join(DATA_DIR, "memory")
os.makedirs(MEMORY_DIR, exist_ok=True)

# ChromaDB 数据目录
CHROMA_DIR = os.path.join(MEMORY_DIR, "chroma")
os.makedirs(CHROMA_DIR, exist_ok=True)


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

    # 分析是否包含重要信息
    important_topics = [
        ("生日", "生日", 8),
        ("喜欢", "喜好", 7),
        ("讨厌", "厌恶", 7),
        ("梦想", "梦想", 8),
        ("工作", "工作", 5),
        ("学校", "学校", 5),
        ("爱好", "爱好", 6),
        ("习惯", "习惯", 5),
        ("名字", "基本信息", 6),
        ("在哪里", "位置", 4),
    ]

    memory_ids = []
    message_combined = user_message + " " + ai_response

    for topic, mem_type, importance in important_topics:
        if topic in message_combined:
            # 提取相关内容
            memory_ids.append(
                memory_service.add_memory(
                    character_id=character_id,
                    content=message_combined,
                    memory_type=mem_type,
                    importance=importance
                )
            )

    return memory_ids

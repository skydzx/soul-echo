from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter()


class AddMemoryRequest(BaseModel):
    character_id: str
    content: str
    memory_type: str = "对话"
    importance: int = 5


class MemoryResponse(BaseModel):
    id: str
    content: str
    metadata: dict


class SearchMemoryRequest(BaseModel):
    character_id: str
    query: str
    n_results: int = 5
    min_importance: int = 0


@router.get("/characters/{character_id}/memories")
async def get_memories(character_id: str, limit: int = 10):
    """获取最重要的记忆"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        memories = memory_service.get_important_memories(character_id, limit)

        return {
            "count": len(memories),
            "memories": memories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/characters/{character_id}/memories")
async def add_memory(character_id: str, request: AddMemoryRequest):
    """添加记忆"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        memory_id = memory_service.add_memory(
            character_id=character_id,
            content=request.content,
            memory_type=request.memory_type,
            importance=request.importance
        )

        return {
            "id": memory_id,
            "message": "记忆添加成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/characters/{character_id}/memories/search")
async def search_memories(character_id: str, request: SearchMemoryRequest):
    """搜索相关记忆"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        memories = memory_service.search_memories(
            character_id=character_id,
            query=request.query,
            n_results=request.n_results,
            min_importance=request.min_importance
        )

        return {
            "count": len(memories),
            "memories": memories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/characters/{character_id}/memories/{memory_id}")
async def delete_memory(character_id: str, memory_id: str):
    """删除记忆"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        success = memory_service.delete_memory(character_id, memory_id)

        if success:
            return {"message": "记忆删除成功"}
        else:
            raise HTTPException(status_code=404, detail="记忆不存在")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/characters/{character_id}/memories")
async def clear_memories(character_id: str):
    """清除所有记忆"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        success = memory_service.clear_all_memories(character_id)

        if success:
            return {"message": "所有记忆已清除"}
        else:
            raise HTTPException(status_code=500, detail="清除失败")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/characters/{character_id}/memories/count")
async def get_memory_count(character_id: str):
    """获取记忆数量"""
    try:
        from app.services.memory import get_memory_service

        memory_service = get_memory_service()
        count = memory_service.get_memory_count(character_id)

        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

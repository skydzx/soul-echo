from fastapi import APIRouter

router = APIRouter()

# 路由将在子模块中定义
from app.api import characters, chat

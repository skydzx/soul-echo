from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from app.api import characters, chat, tts, avatar, memory, image
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    init_db()
    yield
    # 关闭时清理资源
    pass


app = FastAPI(
    title="SoulEcho API",
    description="AI 灵魂伴侣后端服务",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(characters.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(avatar.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(image.router, prefix="/api")

# 静态文件服务（音频文件）
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 音频目录别名
audio_dir = os.path.join(static_dir, "audio")
if os.path.exists(audio_dir):
    app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")

# 头像目录
avatar_dir = os.path.join(static_dir, "avatars")
if os.path.exists(avatar_dir):
    app.mount("/avatars", StaticFiles(directory=avatar_dir), name="avatars")

# 图片目录
images_dir = os.path.join(static_dir, "images")
if os.path.exists(images_dir):
    app.mount("/images", StaticFiles(directory=images_dir), name="images")


@app.get("/")
async def root():
    return {
        "message": "SoulEcho API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

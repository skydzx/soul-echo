from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from datetime import datetime, timedelta
import jwt
import os
import hashlib
import json

router = APIRouter()

# 数据存储
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
USERS_FILE = os.path.join(DATA_DIR, "users.json")


def load_users():
    """加载用户数据"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_users(users):
    """保存用户数据"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


# JWT配置
SECRET_KEY = os.getenv("JWT_SECRET", "soul-echo-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天


def create_access_token(data: dict):
    """创建JWT令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed


def get_password_hash(password: str) -> str:
    """加密密码"""
    return hashlib.sha256(password.encode()).hexdigest()


# Pydantic 模型
class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar: Optional[str] = None
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserRegister):
    """用户注册"""
    users = load_users()

    # 检查用户名是否存在
    for u in users.values():
        if u["username"] == user.username:
            raise HTTPException(status_code=400, detail="用户名已存在")
        if u["email"] == user.email:
            raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 创建新用户
    user_id = str(uuid4())
    now = datetime.now().isoformat()

    new_user = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password": get_password_hash(user.password),
        "avatar": None,
        "created_at": now
    }

    users[user_id] = new_user
    save_users(users)

    # 创建token
    access_token = create_access_token(data={"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**new_user)
    )


@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """用户登录"""
    users = load_users()

    # 查找用户
    user = None
    for u in users.values():
        if u["username"] == credentials.username:
            user = u
            break

    if not user:
        raise HTTPException(status_code=400, detail="用户名不存在")

    # 验证密码
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=400, detail="密码错误")

    # 创建token
    access_token = create_access_token(data={"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = None):
    """获取当前用户信息（需要认证）"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")

    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="无效令牌")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="无效令牌")

    users = load_users()
    if user_id not in users:
        raise HTTPException(status_code=401, detail="用户不存在")

    return UserResponse(**users[user_id])

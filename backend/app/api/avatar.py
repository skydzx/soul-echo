from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from pathlib import Path
from PIL import Image
import shutil

router = APIRouter()

# 头像存储目录
AVATAR_DIR = "static/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

# 允许的图片格式
ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


class AvatarResponse(BaseModel):
    url: str
    message: str


@router.post("/characters/avatar/upload")
async def upload_avatar_before_create(
    file: UploadFile = File(...)
):
    """创建角色前上传头像（返回临时URL）"""
    # 验证文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP"
        )

    # 验证文件大小（2MB）
    MAX_SIZE = 2 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="图片大小不能超过 2MB"
        )

    # 生成临时文件名
    temp_id = uuid.uuid4().hex[:12]
    ext = file.content_type.split('/')[-1]
    if ext == 'jpeg':
        ext = 'jpg'

    filename = f"temp_{temp_id}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    # 保存文件
    with open(filepath, 'wb') as f:
        f.write(content)

    # 调整头像大小
    resize_avatar(filepath)

    # 返回临时URL（用于创建角色时关联）
    temp_url = f"/avatars/{filename}"

    return {
        "url": temp_url,
        "temp_id": temp_id,
        "message": "头像上传成功"
    }


def resize_avatar(image_path: str, size: tuple = (200, 200)):
    """调整头像尺寸"""
    try:
        with Image.open(image_path) as img:
            # 裁剪为正方形
            min_size = min(img.size)
            left = (img.size[0] - min_size) // 2
            top = (img.size[1] - min_size) // 2
            right = left + min_size
            bottom = top + min_size
            img = img.crop((left, top, right, bottom))

            # 调整大小
            img = img.resize(size, Image.Resampling.LANCZOS)

            # 保存
            img.save(image_path, quality=85)
    except Exception as e:
        print(f"头像调整失败: {e}")


@router.post("/characters/{character_id}/avatar")
async def upload_avatar(
    character_id: str,
    file: UploadFile = File(...)
):
    """上传角色头像"""
    # 验证文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP"
        )

    # 验证文件大小
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="图片大小不能超过 5MB"
        )

    # 生成唯一文件名
    ext = file.content_type.split('/')[-1]
    if ext == 'jpeg':
        ext = 'jpg'

    filename = f"{character_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    # 保存文件
    with open(filepath, 'wb') as f:
        f.write(content)

    # 调整头像大小
    resize_avatar(filepath)

    # 返回 URL（相对路径）
    avatar_url = f"/avatars/{filename}"

    # 更新角色数据
    from app.api.characters import load_characters, save_characters
    characters = load_characters()

    if character_id not in characters:
        # 删除刚上传的文件
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=404, detail="角色不存在")

    characters[character_id]['avatar'] = avatar_url
    save_characters(characters)

    return AvatarResponse(
        url=avatar_url,
        message="头像上传成功"
    )


@router.delete("/characters/{character_id}/avatar")
async def delete_avatar(character_id: str):
    """删除角色头像"""
    from app.api.characters import load_characters, save_characters
    characters = load_characters()

    if character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    character = characters[character_id]
    old_avatar = character.get('avatar')

    # 删除旧头像文件
    if old_avatar:
        old_path = os.path.join("static", old_avatar.lstrip('/'))
        if os.path.exists(old_path):
            os.remove(old_path)

    # 更新角色数据
    character['avatar'] = None
    save_characters(characters)

    return {"message": "头像已删除"}


@router.get("/characters/{character_id}/avatar")
async def get_avatar(character_id: str):
    """获取角色头像 URL"""
    from app.api.characters import load_characters
    characters = load_characters()

    if character_id not in characters:
        raise HTTPException(status_code=404, detail="角色不存在")

    avatar = characters[character_id].get('avatar')
    if avatar:
        return {"url": avatar}
    else:
        # 返回默认头像
        return {"url": None}

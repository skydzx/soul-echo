from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
from pathlib import Path

router = APIRouter()

# 图片存储目录
IMAGES_DIR = "static/images"
os.makedirs(IMAGES_DIR, exist_ok=True)

# 允许的图片格式
ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


class ImageResponse(BaseModel):
    url: str
    message: str


@router.post("/characters/{character_id}/images")
async def upload_image(
    character_id: str,
    file: UploadFile = File(...)
):
    """上传图片"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP"
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="图片大小不能超过 10MB"
        )

    # 生成唯一文件名
    ext = file.content_type.split('/')[-1]
    if ext == 'jpeg':
        ext = 'jpg'

    filename = f"{character_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(IMAGES_DIR, filename)

    with open(filepath, 'wb') as f:
        f.write(content)

    image_url = f"/images/{filename}"

    return ImageResponse(
        url=image_url,
        message="图片上传成功"
    )


@router.delete("/characters/{character_id}/images/{filename}")
async def delete_image(character_id: str, filename: str):
    """删除图片"""
    filepath = os.path.join(IMAGES_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"message": "图片已删除"}
    raise HTTPException(status_code=404, detail="图片不存在")


@router.get("/characters/{character_id}/images")
async def get_images(character_id: str):
    """获取该角色的所有图片"""
    if not os.path.exists(IMAGES_DIR):
        return {"images": []}

    images = []
    for filename in os.listdir(IMAGES_DIR):
        if filename.startswith(character_id + "_"):
            images.append({
                "url": f"/images/{filename}",
                "filename": filename
            })

    return {"images": images}

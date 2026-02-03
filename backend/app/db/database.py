import os
import json

DATA_DIR = "data"
CHARACTERS_FILE = os.path.join(DATA_DIR, "characters.json")


def init_db():
    """初始化数据库"""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False)

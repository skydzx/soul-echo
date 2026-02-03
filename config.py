import os

# API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("MODEL_NAME", "gpt-3.5-turbo")

# 对话配置
MAX_TOKENS = 1000
TEMPERATURE = 0.8
MEMORY_LENGTH = 20  # 保留最近多少轮对话

# 数据存储
CHARACTERS_DIR = "characters"
DATA_DIR = "data"

# UI 配置
PAGE_TITLE = "SoulEcho - AI 灵魂伴侣"
PAGE_ICON = "💕"

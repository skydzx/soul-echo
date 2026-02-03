import streamlit as st
import uuid
from config import *
from utils.chat import get_character_manager, ChatBot
from openai import OpenAI
import os

# 页面配置
st.set_page_config(
    page_title=PAGE_TITLE,
    page_icon=PAGE_ICON,
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定义CSS
st.markdown("""
<style>
    .main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .stApp {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .title-text {
        text-align: center;
        color: #ff6b9d;
        font-size: 3em;
        margin-bottom: 0.5em;
    }
    .subtitle {
        text-align: center;
        color: #a0a0a0;
        font-size: 1.2em;
    }
    .chat-message {
        padding: 15px;
        border-radius: 15px;
        margin: 10px 0;
        animation: fadeIn 0.3s ease;
    }
    .user-message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .bot-message {
        background: linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%);
        color: white;
        border: 1px solid #4a4a6a;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .stButton>button {
        background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
        border: none;
        border-radius: 25px;
        padding: 10px 30px;
        color: white;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 20px rgba(255, 107, 157, 0.4);
    }
    .card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 20px;
        margin: 10px 0;
        backdrop-filter: blur(10px);
    }
</style>
""", unsafe_allow_html=True)


def init_session_state():
    """初始化会话状态"""
    if 'current_character' not in st.session_state:
        st.session_state.current_character = None
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'api_key' not in st.session_state:
        st.session_state.api_key = ""


def get_api_client():
    """获取API客户端"""
    api_key = st.session_state.get('api_key')
    if not api_key:
        api_key = st.sidebar.text_input("🔑 OpenAI API Key", type="password")
        if not api_key:
            st.warning("请在侧边栏输入 OpenAI API Key 以继续")
            return None
        st.session_state.api_key = api_key

    try:
        return OpenAI(api_key=api_key)
    except Exception as e:
        st.error(f"API 密钥错误: {e}")
        return None


def create_character_page():
    """创建新角色页面"""
    st.markdown('<p class="title-text">💕 创建你的SoulEcho</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">定制专属于你的AI伴侣</p>', unsafe_allow_html=True)

    with st.container():
        col1, col2 = st.columns([1, 1])

        with col1:
            st.markdown("### 📝 基本信息")
            name = st.text_input("姓名", placeholder="给她/他起个名字")
            gender = st.selectbox("性别", ["女性", "男性", "其他"])
            age = st.slider("年龄", 18, 60, 22)

            st.markdown("### 🎨 外貌特征")
            appearance = st.text_area("外貌描述", placeholder="例如：长发飘飘，眼睛很大，喜欢穿裙子...", height=100)

        with col2:
            st.markdown("### 💭 性格特点")
            col_a, col_b = st.columns(2)
            with col_a:
                personality = {
                    "性格": st.selectbox("整体性格", ["温柔体贴", "活泼开朗", "成熟稳重", "可爱俏皮", "独立自主", "内敛文静"]),
                    "说话风格": st.selectbox("说话风格", ["温柔型", "直爽型", "幽默型", "文艺型", "霸气型"]),
                    "情绪": st.selectbox("情绪表达", ["丰富多变", "温和稳定", "偶尔小脾气"]),
                }
            with col_b:
                personality["兴趣"] = st.multiselect("兴趣爱好",
                    ["音乐", "阅读", "运动", "美食", "旅行", "电影", "游戏", "艺术", "科技", "摄影", "绘画", "写作"])

            st.markdown("### 📖 背景故事")
            background = st.text_area("背景故事", placeholder="她/他的成长经历、生活环境...", height=80)

    st.markdown("### 💝 关系设定")
    relationship_type = st.select_slider(
        "你们的关系是？",
        options=["普通朋友", "知己", "暧昧对象", "恋人", "灵魂伴侣"],
        value="朋友"
    )

    if st.button("✨ 创建角色", use_container_width=True):
        if not name:
            st.error("请输入姓名！")
            return

        manager = get_character_manager()
        character_id = manager.create_character(
            name=name,
            gender=gender,
            age=age,
            appearance=appearance,
            personality=personality,
            hobbies=personality.get("兴趣", []),
            background=background,
            relationship_type=relationship_type
        )

        st.success(f"✨ {name} 创建成功！")
        st.session_state.current_character = character_id
        st.session_state.messages = []
        st.rerun()


def chat_page():
    """聊天页面"""
    manager = get_character_manager()
    character = manager.get_character(st.session_state.current_character)

    if not character:
        st.error("角色不存在！")
        st.session_state.current_character = None
        st.rerun()
        return

    # 显示角色信息
    with st.sidebar:
        st.markdown(f"### 💕 {character['name']}")
        st.info(f"**{character['relationship_type']}** | {character['gender']}性 | {character['age']}岁")

        if st.button("🔙 返回角色列表"):
            st.session_state.current_character = None
            st.rerun()

        st.markdown("---")
        st.markdown("#### 📋 角色档案")
        st.write(f"**外貌**：{character.get('appearance', '未设置')[:100]}...")
        st.write(f"**性格**：{character['personality'].get('性格', '未设置')}")
        st.write(f"**爱好**：{', '.join(character.get('hobbies', []))}")

        st.markdown("---")
        if st.button("🗑️ 删除此角色"):
            manager.delete_character(st.session_state.current_character)
            st.session_state.current_character = None
            st.rerun()

    # 聊天区域
    st.markdown(f'<p class="title-text">💬 与 {character["name"]} 的对话</p>', unsafe_allow_html=True)

    # 显示消息历史
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])

    # 聊天输入
    if prompt := st.chat_input("输入你想说的话..."):
        # 显示用户消息
        st.chat_message("user").write(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})

        # 获取AI回复
        client = get_api_client()
        if client:
            chat_bot = ChatBot(st.session_state.api_key)

            # 更新对话历史
            manager.update_chat(st.session_state.current_character, "user", prompt)

            with st.spinner(f"{character['name']} 正在思考..."):
                response = chat_bot.generate_response(character, prompt)

            st.chat_message("assistant").write(response)
            st.session_state.messages.append({"role": "assistant", "content": response})

            # 更新对话历史
            manager.update_chat(st.session_state.current_character, "assistant", response)


def main_page():
    """主页面 - 角色列表"""
    st.markdown('<p class="title-text">💕 SoulEcho</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">AI 灵魂伴侣 | 心灵共鸣，情感陪伴</p>', unsafe_allow_html=True)

    manager = get_character_manager()
    characters = manager.get_all_characters()

    # API Key 输入
    with st.sidebar:
        st.markdown("### 🔑 API 设置")
        api_key = st.text_input("OpenAI API Key", type="password", help="需要 OpenAI API Key 才能使用对话功能")
        if api_key:
            st.session_state.api_key = api_key

        st.markdown("---")
        st.markdown("### 📌 使用说明")
        st.info("""
        1. 输入 OpenAI API Key
        2. 创建你的理想型角色
        3. 开始心灵对话
        💡 你的对话记录会保存在本地
        """)

    st.markdown("---")

    if st.button("➕ 创建新角色", use_container_width=True):
        st.session_state.current_character = "create"

    st.markdown("### 🌟 我的伴侣")
    if not characters:
        st.info("还没有创建角色，点击上方按钮开始吧！")
    else:
        cols = st.columns(3)
        for i, char in enumerate(characters):
            with cols[i % 3]:
                with st.container():
                    st.markdown(f"""
                    <div class="card">
                        <h3>💕 {char['name']}</h3>
                        <p>{char['relationship_type']} | {char['gender']}性 | {char['age']}岁</p>
                        <p><small>性格：{char['personality'].get('性格', '未知')}</small></p>
                    </div>
                    """, unsafe_allow_html=True)
                    if st.button(f"💬 开始对话", key=f"chat_{char['id']}"):
                        st.session_state.current_character = char['id']
                        st.session_state.messages = []
                        st.rerun()


def main():
    init_session_state()

    # 路由逻辑
    if st.session_state.current_character == "create":
        create_character_page()
    elif st.session_state.current_character:
        chat_page()
    else:
        main_page()


if __name__ == "__main__":
    main()

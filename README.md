# SoulEcho - AI 灵魂伴侣

一个基于AI的虚拟伴侣应用，可以创建和定制你的理想型，进行深度对话和情感交流。

## 功能特性

- **个性化创建**：设置理想型的姓名、年龄、外貌、性格、爱好等
- **智能对话**：基于大语言模型的自然对话能力
- **记忆系统**：记住你们的对话内容和共同回忆
- **多角色支持**：可以创建多个不同类型的AI伴侣
- **情感互动**：模拟真实的情感情绪和互动

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行应用

```bash
streamlit run app.py
```

## 项目结构

```
SoulEcho/
├── app.py              # 主应用入口
├── config.py           # 配置文件
├── requirements.txt    # 依赖列表
├── characters/         # 角色数据存储
├── utils/
│   └── chat.py         # 对话逻辑
└── README.md
```

## 技术栈

- Python 3.8+
- Streamlit (Web UI)
- OpenAI API (或其他LLM API)
- ChromaDB (向量数据库，可选)

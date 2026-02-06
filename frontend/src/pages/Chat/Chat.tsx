import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Zap, X, Image as ImageIcon, Mic, Search, Download, Trash2, ChevronDown, Brain, Volume2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useCharacterStore } from '@/stores/characterStore';
import { useAuthStore } from '@/stores/authStore';
import AudioPlayer from '@/components/chat/AudioPlayer';
import ImageUploader from '@/components/chat/ImageUploader';
import VoiceSettings from '@/components/chat/VoiceSettings';
import VoiceInput from '@/components/chat/VoiceInput';
import { chatApi } from '@/services/api';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { characters, fetchCharacters } = useCharacterStore();
  const { isAuthenticated } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [chatStats, setChatStats] = useState<any>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);

  const character = characters.find((c) => c.id === id);
  const { messages, loading, loadingMore, streaming, sendMessage, messagesEndRef, loadHistory, loadMoreHistory, searchHistory, exportHistory, clearMessages, getStats, hasMore } = useChat(id || null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 登录保护
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!character) {
      fetchCharacters();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadHistory();
      // 加载统计信息
      const loadStats = async () => {
        const stats = await getStats();
        if (stats) setChatStats(stats);
      };
      loadStats();
      // 加载语音自动播放设置
      const savedAutoPlay = localStorage.getItem('soulecho_autoplay');
      setAutoPlayVoice(savedAutoPlay === 'true');
    }
  }, [id]);

  // 滚动监听 - 加载更多
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 100 && hasMore && messages.length > 0) {
      loadMoreHistory();
    }
  }, [loadingMore, hasMore, messages.length, loadMoreHistory]);

  // 搜索聊天记录
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchHistory(searchQuery);
    if (results) {
      setSearchResults(results.results || []);
    }
  };

  // 导出聊天记录
  const handleExport = async () => {
    const data = await exportHistory();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soulecho-${character?.name || 'chat'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 清空聊天记录
  const handleClearChat = async () => {
    if (window.confirm('确定要清空聊天记录吗？此操作不可恢复。')) {
      await clearMessages();
      setChatStats(null);
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || sending) return;

    setSending(true);

    try {
      // 如果有图片，使用多模态发送
      if (selectedImages.length > 0) {
        await chatApi.sendMultimodal({
          character_id: id!,
          message: inputValue.trim() || '分享了一张图片',
          images: selectedImages,
        });
        // 刷新消息历史
        const { loadHistory: load } = await import('@/hooks/useChat');
        const chatHook = load(id!);
        await chatHook.loadHistory();
      } else {
        await sendMessage(inputValue);
      }

      setInputValue('');
      setSelectedImages([]);
      setShowQuickReplies(false);
    } catch (error) {
      console.error('发送失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = async (msg: string) => {
    setSending(true);
    try {
      await sendMessage(msg);
      setShowQuickReplies(false);
    } finally {
      setSending(false);
    }
  };

  const handleImagesSelected = (urls: string[]) => {
    setSelectedImages(urls);
  };

  // 处理语音录制完成
  const handleVoiceRecordingComplete = async (blob: Blob) => {
    // 将语音转换为文本
    setShowVoiceInput(false);
    setSending(true);

    try {
      // 这里应该调用语音识别 API
      // 暂时用模拟的文本代替
      // 实际项目中需要调用 Whisper 或其他 STT 服务
      const formData = new FormData();
      formData.append('file', blob, 'voice.webm');

      // 尝试使用浏览器内置的语音识别
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // 直接发送语音消息
        await chatApi.sendMultimodal({
          character_id: id!,
          message: '[语音消息]',
          images: [],
        });
      } else {
        // 降级处理：提示用户
        await sendMessage('[用户发送了语音消息]');
      }

      // 刷新消息历史
      const { loadHistory: load } = await import('@/hooks/useChat');
      const chatHook = load(id!);
      await chatHook.loadHistory();
    } catch (error) {
      console.error('语音消息发送失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceCancel = () => {
    setShowVoiceInput(false);
  };
  };

  // 根据角色性格动态生成快捷回复
  const getQuickReplies = () => {
    const base = [
      { text: '今天过得怎么样？', icon: '🌤️' },
      { text: '想你啦~', icon: '💕' },
      { text: '在干嘛呢？', icon: '❓' },
      { text: '聊聊你的爱好', icon: '🎨' },
      { text: '给我讲个故事', icon: '📖' },
    ];

    if (character?.personality?.性格?.includes('温柔')) {
      base.push({ text: '抱抱你', icon: '🤗' });
    }
    if (character?.personality?.性格?.includes('活泼')) {
      base.push({ text: '一起玩呀', icon: '🎉' });
    }

    return base;
  };

  const quickReplies = getQuickReplies();

  // 表情包快捷栏
  const emojiPacks = [
    { name: '基础', emojis: ['😀', '😂', '😍', '😊', '🥰', '😎', '🤔', '😴', '😭', '😡'] },
    { name: '爱心', emojis: ['💕', '💖', '💗', '💓', '💞', '💘', '❤️', '🧡', '💛', '💚'] },
    { name: '表情', emojis: ['👍', '👎', '👌', '🤝', '🙏', '💪', '🤗', '😘', '😗', '😚'] },
  ];
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeEmojiPack, setActiveEmojiPack] = useState(0);

  // 按日期分组消息
  const groupedMessages = messages.reduce((groups: { date: string; messages: any[] }[], msg) => {
    const date = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }) : '未知时间';

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
    return groups;
  }, []);

  // 格式化日期显示
  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (dateStr.includes(today)) return '今天';
    if (dateStr.includes(yesterday)) return '昨天';
    return dateStr;
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">角色加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* 聊天头部 */}
      <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          {character.avatar ? (
            <img
              src={`${API_BASE}${character.avatar}`}
              alt={character.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-pink-400 rounded-xl flex items-center justify-center text-xl">
              {character.gender === '女性' ? '👩' : '👨'}
            </div>
          )}
          <div>
            <h2 className="text-white font-medium">{character.name}</h2>
            <p className="text-gray-400 text-xs">{character.relationship_type}</p>
          </div>
        </div>

        {/* 搜索按钮 */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-primary-500 text-white' : 'hover:bg-white/10 text-gray-400'}`}
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 记忆管理按钮 */}
        <Link
          to={`/memories/${id}`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
          title="记忆管理"
        >
          <Brain className="w-5 h-5" />
        </Link>

        {/* 语音设置按钮 */}
        <button
          onClick={() => setShowVoiceSettings(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
          title="语音设置"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* 导出按钮 */}
        <button
          onClick={handleExport}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
          title="导出聊天记录"
        >
          <Download className="w-5 h-5" />
        </button>

        {/* 统计按钮 */}
        <button
          onClick={() => setShowStats(!showStats)}
          className={`p-2 rounded-full transition-colors ${showStats ? 'bg-primary-500 text-white' : 'hover:bg-white/10 text-gray-400'}`}
          title="聊天统计"
        >
          <span className="text-sm font-medium">{messages.length}</span>
        </button>

        <Link
          to={`/profile/${character.id}`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </Link>
      </header>

      {/* 搜索框 */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass border-b border-white/10 overflow-hidden"
          >
            <div className="p-3 flex gap-2">
              <input
                type="text"
                placeholder="搜索聊天记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-500 rounded-lg text-white hover:bg-primary-600 transition-colors"
              >
                搜索
              </button>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-3 py-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="px-3 pb-3">
                <p className="text-gray-400 text-sm mb-2">找到 {searchResults.length} 条相关消息</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white/5 rounded-lg text-sm cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        // 滚动到对应消息
                        setShowSearch(false);
                      }}
                    >
                      <span className={`inline-block w-12 text-xs ${result.role === 'user' ? 'text-pink-400' : 'text-primary-400'}`}>
                        {result.role === 'user' ? '我' : character.name}
                      </span>
                      <span className="text-gray-300 ml-2">{result.content.slice(0, 50)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 统计面板 */}
      <AnimatePresence>
        {showStats && chatStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass border-b border-white/10 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">聊天统计</h3>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{chatStats.total_messages}</p>
                  <p className="text-gray-400 text-xs">总消息数</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary-400">{chatStats.chat_days}</p>
                  <p className="text-gray-400 text-xs">聊天天数</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-pink-400">{Math.round(chatStats.total_characters / 100)}</p>
                  <p className="text-gray-400 text-xs">对话字数(百)</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleClearChat}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  清空聊天
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 消息区域 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* 加载更多提示 */}
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                加载中...
              </div>
            ) : (
              <button
                onClick={() => loadMoreHistory()}
                className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                加载更多消息
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{character.gender === '女性' ? '👩' : '👨'}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">和 {character.name} 的对话</h3>
              <p className="text-gray-400 mb-6">发送文字、表情包或图片来开始聊天吧</p>

              {/* 快捷表情包 */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {['😀', '😂', '😍', '😊', '🥰', '👋'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReply(emoji)}
                    className="w-12 h-12 text-2xl bg-white/10 rounded-xl hover:bg-white/20 transition-all hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 按日期分组显示消息 */}
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* 日期分隔线 */}
            <div className="flex items-center justify-center my-4">
              <span className="px-4 py-1 text-xs text-gray-500 bg-white/5 rounded-full">
                {formatDateHeader(group.date)}
              </span>
            </div>

            {/* 该日期的消息 */}
            {group.messages.map((message, index) => (
              <motion.div
                key={`${groupIndex}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
              <div
                className={`max-w-[75%] rounded-2xl overflow-hidden ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white rounded-br-sm'
                    : 'glass text-white rounded-bl-sm'
                }`}
              >
                {/* 显示图片/表情包 */}
                {(message as any).images?.length > 0 && (
                  <div className="flex flex-wrap gap-1 p-1">
                    {(message as any).images.map((img: string, i: number) => (
                      <div key={i} className="relative">
                        {img.startsWith('emoji:') ? (
                          <span className="text-4xl p-2">{img.replace('emoji:', '')}</span>
                        ) : (
                          <img
                            src={`${API_BASE}${img}`}
                            alt={`图片 ${i + 1}`}
                            className="max-w-[150px] max-h-[150px] object-cover rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 显示文字内容 */}
                {message.content && (
                  <div className="px-4 py-3">
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}

                {/* 底部栏 */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {message.role === 'assistant' && message.content && (
                      <AudioPlayer
                        text={message.content}
                        gender={character.gender}
                      />
                    )}
                  </div>
                  {message.timestamp && (
                    <p className={`text-xs ${message.role === 'user' ? 'text-white/60' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
            ))}
          </div>
        ))}

        {(loading || streaming) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">{streaming ? '正在输入...' : '思考中'}</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="glass border-t border-white/10">
        {/* 图片预览 */}
        {selectedImages.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {selectedImages.map((url, index) => (
                <div key={index} className="relative flex-shrink-0">
                  {url.startsWith('emoji:') ? (
                    <span className="text-4xl">{url.replace('emoji:', '')}</span>
                  ) : (
                    <img
                      src={`${API_BASE}${url}`}
                      alt={`预览 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快捷回复展开区域 */}
        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">快捷回复</span>
                  <button
                    onClick={() => setShowQuickReplies(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply.text)}
                      disabled={sending}
                      className="px-3 py-2 bg-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      <span className="mr-1">{reply.icon}</span>
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 表情包展开区域 */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-white/10">
                {/* 表情包分类 */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {emojiPacks.map((pack, index) => (
                    <button
                      key={pack.name}
                      onClick={() => setActiveEmojiPack(index)}
                      className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
                        activeEmojiPack === index
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {pack.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowEmoji(false)}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                  >
                    关闭
                  </button>
                </div>

                {/* 表情包网格 */}
                <div className="grid grid-cols-10 gap-1">
                  {emojiPacks[activeEmojiPack].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (selectedImages.length < 9) {
                          setSelectedImages(prev => [...prev, `emoji:${emoji}`]);
                        }
                      }}
                      disabled={selectedImages.length >= 9}
                      className="w-8 h-8 text-xl hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {selectedImages.length > 0 && (
                  <button
                    onClick={() => handleSend()}
                    disabled={sending}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {sending ? '发送中...' : '发送表情包'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 输入框 */}
        {showVoiceInput ? (
          <div className="flex items-center gap-2 p-4">
            <VoiceInput
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={handleVoiceCancel}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-3 rounded-xl transition-all ${
                showEmoji
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              <span className="text-xl">😊</span>
            </button>

            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className={`p-3 rounded-xl transition-all ${
                showQuickReplies
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              <Zap className="w-5 h-5" />
            </button>

            {/* 语音输入按钮 */}
            <button
              onClick={() => setShowVoiceInput(true)}
              className="p-3 bg-white/10 rounded-xl text-gray-400 hover:bg-white/20 hover:text-white transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={selectedImages.length > 0 ? "添加描述..." : "输入消息..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />

            {/* 图片上传 */}
            {selectedImages.length === 0 && (
              <ImageUploader
                characterId={id || ''}
                onImagesSelected={handleImagesSelected}
              />
            )}

            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && selectedImages.length === 0) || sending}
              className="p-3 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/30 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 语音设置弹窗 */}
      <AnimatePresence>
        {showVoiceSettings && character && (
          <VoiceSettings
            characterGender={character.gender}
            onClose={() => setShowVoiceSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

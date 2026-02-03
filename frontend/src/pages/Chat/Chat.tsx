import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Heart, MoreVertical, Sparkles, Volume2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useCharacterStore } from '@/stores/characterStore';
import AudioPlayer from '@/components/chat/AudioPlayer';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { characters, fetchCharacters } = useCharacterStore();
  const [inputValue, setInputValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const character = characters.find((c) => c.id === id);
  const { messages, loading, streaming, sendMessage, messagesEndRef } = useChat(id || null);

  useEffect(() => {
    if (!character) {
      fetchCharacters();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const loadHistory = async () => {
        const { loadHistory: load } = await import('@/hooks/useChat');
        const chatHook = load(id);
        await chatHook.loadHistory();
      };
      loadHistory();
    }
  }, [id]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  const quickMessages = [
    '今天过得怎么样？',
    '想你啦~',
    '有什么想和我说的吗？',
    '聊聊你的爱好吧',
    '给我讲个故事吧',
  ];

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 mb-4">角色加载中...</p>
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
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-pink-400 rounded-xl flex items-center justify-center text-xl">
            {character.gender === '女性' ? '👩' : '👨'}
          </div>
          <div>
            <h2 className="text-white font-medium">{character.name}</h2>
            <p className="text-gray-400 text-xs">{character.relationship_type}</p>
          </div>
        </div>

        <Link
          to={`/profile/${character.id}`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </Link>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">和 {character.name} 的对话</h3>
              <p className="text-gray-400 mb-6">开始你们的第一次交流吧</p>

              {/* 快捷消息 */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {quickMessages.map((msg, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(msg)}
                    className="px-4 py-2 bg-white/10 rounded-full text-sm text-gray-300 hover:bg-white/20 transition-all"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white rounded-br-sm'
                    : 'glass text-white rounded-bl-sm'
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>

                <div className="flex items-center justify-between mt-2">
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
        </AnimatePresence>

        {(loading || streaming) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2"
            >
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
      <div className="glass border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-3 rounded-xl transition-colors ${
              showEmoji ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <Heart className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="输入消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading || streaming}
            className="p-3 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/30 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

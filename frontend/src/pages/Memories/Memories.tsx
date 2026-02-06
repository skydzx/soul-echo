import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Search, Sparkles, RefreshCw, Filter, Tag } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { memoryApi } from '@/services/api';

interface Memory {
  id: string;
  content: string;
  metadata: {
    type: string;
    importance: number;
    created_at: string;
    distance?: number;
  };
}

const MEMORY_TYPE_COLORS: Record<string, string> = {
  '生日': 'bg-pink-500',
  '喜好': 'bg-green-500',
  '厌恶': 'bg-red-500',
  '梦想': 'bg-purple-500',
  '工作': 'bg-blue-500',
  '学校': 'bg-indigo-500',
  '爱好': 'bg-yellow-500',
  '习惯': 'bg-orange-500',
  '基本信息': 'bg-gray-500',
  '位置': 'bg-cyan-500',
  '关系': 'bg-pink-400',
  '重要事件': 'bg-red-400',
  '情感': 'bg-purple-400',
  '日常': 'bg-gray-400',
  '计划': 'bg-teal-500',
  '对话': 'bg-primary-500',
};

export default function Memories() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{ count: number; types: Record<string, number> }>({
    count: 0,
    types: {},
  });

  // 登录保护
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (id) {
      loadMemories();
    }
  }, [id]);

  const loadMemories = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 获取所有记忆
      const response = await fetch(`/api/characters/${id}/memories/all?limit=100`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('soul-auth') ? JSON.parse(localStorage.getItem('soul-auth') || '{}').state?.token || JSON.parse(localStorage.getItem('soul-auth') || '{}').token : ''}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);

        // 统计各类记忆数量
        const typeCount: Record<string, number> = {};
        (data.memories || []).forEach((m: Memory) => {
          const type = m.metadata?.type || '对话';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        setStats({ count: data.memories?.length || 0, types: typeCount });
      }
    } catch (error) {
      console.error('加载记忆失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!id) return;
    try {
      await memoryApi.deleteMemory(id, memoryId);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      setStats((prev) => ({ ...prev, count: prev.count - 1 }));
    } catch (error) {
      console.error('删除记忆失败:', error);
    }
  };

  const handleConsolidate = async () => {
    if (!id) return;
    setConsolidating(true);
    try {
      const response = await fetch(`/api/characters/${id}/memories/consolidate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('soul-auth') ? JSON.parse(localStorage.getItem('soul-auth') || '{}').state?.token || JSON.parse(localStorage.getItem('soul-auth') || '{}').token : ''}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        alert(`已合并 ${data.deleted_count} 条相似记忆`);
        loadMemories();
      }
    } catch (error) {
      console.error('合并记忆失败:', error);
    } finally {
      setConsolidating(false);
    }
  };

  // 过滤和搜索
  const filteredMemories = memories.filter((m) => {
    const matchesType = !filterType || m.metadata?.type === filterType;
    const matchesSearch = !searchQuery ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // 按重要性排序
  const sortedMemories = [...filteredMemories].sort(
    (a, b) => (b.metadata?.importance || 0) - (a.metadata?.importance || 0)
  );

  // 获取所有记忆类型
  const memoryTypes = Object.keys(MEMORY_TYPE_COLORS);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">记忆加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(`/chat/${id}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回聊天</span>
        </button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">记忆管理中心</h1>
          <p className="text-gray-400">
            共 {stats.count} 条记忆 · AI 自动学习你的偏好
          </p>
        </div>

        {/* 工具栏 */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索记忆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* 合并记忆按钮 */}
            <button
              onClick={handleConsolidate}
              disabled={consolidating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg text-white hover:shadow-lg transition-all disabled:opacity-50"
            >
              {consolidating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {consolidating ? '合并中...' : '合并相似记忆'}
            </button>
          </div>

          {/* 记忆类型过滤 */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setFilterType(null)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                !filterType
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              全部
            </button>
            {memoryTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1 ${
                  filterType === type
                    ? `${MEMORY_TYPE_COLORS[type] || 'bg-primary-500'} text-white`
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Tag className="w-3 h-3" />
                {type}
                {stats.types[type] && (
                  <span className="text-xs opacity-75">({stats.types[type]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 记忆列表 */}
        {sortedMemories.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? '没有找到相关记忆' : '暂无记忆'}
            </h3>
            <p className="text-gray-400">
              {searchQuery
                ? '尝试其他搜索词'
                : '开始与 AI 角色聊天，AI 会自动学习你的偏好'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass rounded-xl p-4 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* 重要性指示 */}
                    <div className="flex flex-col items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-2 h-2 rounded-full ${
                            (memory.metadata?.importance || 0) >= level * 2
                              ? 'bg-yellow-400'
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* 记忆内容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            MEMORY_TYPE_COLORS[memory.metadata?.type || '对话'] || 'bg-primary-500'
                          } text-white`}
                        >
                          {memory.metadata?.type || '对话'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          重要度: {memory.metadata?.importance || 5}/10
                        </span>
                      </div>
                      <p className="text-white leading-relaxed">{memory.content}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {memory.metadata?.created_at
                          ? new Date(memory.metadata.created_at).toLocaleString('zh-CN')
                          : ''}
                      </p>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

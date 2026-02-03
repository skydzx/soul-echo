import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { useCharacterStore } from '@/stores/characterStore';
import Button from '@/components/ui/Button';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { characters, fetchCharacters, deleteCharacter } = useCharacterStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const character = characters.find((c) => c.id === id);

  useEffect(() => {
    if (!characters.length) {
      fetchCharacters();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteCharacter(id);
    navigate('/');
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400">角色加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 角色信息 */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* 头部背景 */}
          <div className="h-32 bg-gradient-to-r from-primary-500 via-pink-500 to-purple-500" />

          {/* 角色信息 */}
          <div className="px-6 pb-6">
            {/* 头像 */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-pink-400 rounded-2xl flex items-center justify-center text-6xl shadow-xl">
                {character.gender === '女性' ? '👩' : character.gender === '男性' ? '👨' : '🧑'}
              </div>
              <div className="absolute bottom-2 right-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                {character.relationship_type}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">{character.name}</h1>
              <p className="text-gray-400">
                {character.age}岁 · {character.gender}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mb-6">
              <Link to={`/chat/${character.id}`} className="flex-1">
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  开始对话
                </Button>
              </Link>
              <Button variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                编辑资料
              </Button>
            </div>

            {/* 详细信息 */}
            <div className="space-y-4">
              {/* 外貌 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">外貌特征</h3>
                <p className="text-white">{character.appearance || '未设置'}</p>
              </div>

              {/* 性格 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">性格特点</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(character.personality).map(([key, value]) => {
                    if (Array.isArray(value)) return null;
                    return (
                      <span
                        key={key}
                        className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
                      >
                        {key}: {value}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 爱好 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">兴趣爱好</h3>
                <div className="flex flex-wrap gap-2">
                  {character.hobbies.length > 0 ? (
                    character.hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm"
                      >
                        {hobby}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">未设置</span>
                  )}
                </div>
              </div>

              {/* 背景 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">背景故事</h3>
                <p className="text-white">{character.background || '未设置'}</p>
              </div>

              {/* 统计数据 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">统计信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {character.chat_history?.filter((m: any) => m.role === 'user').length || 0}
                    </p>
                    <p className="text-gray-400 text-sm">对话次数</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {character.memories?.length || 0}
                    </p>
                    <p className="text-gray-400 text-sm">共同记忆</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 删除按钮 */}
            <div className="border-t border-white/10 pt-6 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除角色
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">确认删除</h3>
              <p className="text-gray-400 mb-6">
                确定要删除 {character.name} 吗？此操作不可恢复。
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  删除
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

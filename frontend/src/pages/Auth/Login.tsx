import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import Button from '@/components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const { theme } = useThemeStore();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  // 根据主题获取背景样式
  const getBgClass = () => {
    switch (theme) {
      case 'light':
        return 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300';
      case 'pink':
        return 'bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300';
      default:
        return 'bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300';
    }
  };

  // 根据主题获取文字颜色
  const getTextClass = () => {
    switch (theme) {
      case 'light':
        return 'text-gray-800';
      case 'pink':
        return 'text-pink-900';
      default:
        return 'text-white';
    }
  };

  // 根据主题获取标签文字颜色
  const getLabelClass = () => {
    switch (theme) {
      case 'light':
        return 'text-gray-700';
      case 'pink':
        return 'text-pink-800';
      default:
        return 'text-gray-300';
    }
  };

  // 根据主题获取灰色文字颜色
  const getGrayTextClass = () => {
    switch (theme) {
      case 'light':
        return 'text-gray-500';
      case 'pink':
        return 'text-pink-600';
      default:
        return 'text-gray-400';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${getBgClass()}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* 返回按钮 */}
        <Link
          to="/"
          className={`flex items-center gap-2 mb-6 transition-colors ${getGrayTextClass()} hover:${getTextClass()}`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme === 'light' ? 'from-gray-700 via-gray-800 to-gray-900' : theme === 'pink' ? 'from-pink-600 via-pink-700 to-rose-600' : 'from-white via-pink-200 to-primary-300'} bg-clip-text text-transparent`}>
            SoulEcho
          </h1>
          <p className={`${getGrayTextClass()} mt-2`}>欢迎回来</p>
        </div>

        {/* 表单 */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getLabelClass()} mb-2`}>用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getLabelClass()} mb-2`}>密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full py-4 text-base">
              登录
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

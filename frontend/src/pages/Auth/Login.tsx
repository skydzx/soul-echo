import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        // 注册
        await useAuthStore.getState().register(formData.username, formData.email, formData.password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* 返回按钮 */}
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-pink-200 to-primary-300 bg-clip-text text-transparent">
            SoulEcho
          </h1>
          <p className="text-gray-400 mt-2">{isLogin ? '欢迎回来' : '创建你的账户'}</p>
        </div>

        {/* 表单 */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="请输入邮箱"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-14 pr-4"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-14 pr-4"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-14 pr-4"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {isLogin ? '登录' : '注册'}
            </Button>
          </form>

          {/* 切换登录/注册 */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

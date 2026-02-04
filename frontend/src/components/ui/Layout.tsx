import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Heart, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-pink-400 bg-clip-text text-transparent">
              SoulEcho
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <ThemeSwitcher />

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{user?.username}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 glass rounded-xl py-2 shadow-xl overflow-hidden"
                    >
                      <Link
                        to="/create"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        + 创建角色
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

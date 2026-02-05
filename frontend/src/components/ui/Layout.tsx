import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Heart, User, LogOut, User as UserIcon, Settings, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // 初始化时从 localStorage 同步状态
  useEffect(() => {
    const initAuth = async () => {
      const data = localStorage.getItem('soul-auth');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token && parsed.user) {
            await checkAuth();
          }
        } catch {
          console.error('Failed to parse auth data');
        }
      }
      setMounted(true);
    };
    initAuth();
  }, []);

  // 未挂载时不渲染导航内容，避免闪烁
  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-300">
        <header className="fixed top-0 left-0 right-0 z-50 glass">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-pink-400 bg-clip-text text-transparent">
                SoulEcho
              </span>
            </div>
          </div>
        </header>
        <main className="pt-16 min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  // 获取用户首字母作为头像
  const getInitial = () => {
    return user?.username?.charAt(0).toUpperCase() || 'U';
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
              <div className="relative" ref={menuRef}>
                {/* 用户头像按钮 */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-full transition-all ${
                    showUserMenu ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-semibold">{getInitial()}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* 下拉菜单 */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-2xl overflow-hidden"
                    >
                      {/* 用户信息 */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-white font-medium">{user?.username}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                      </div>

                      {/* 菜单项 */}
                      <div className="py-2">
                        <Link
                          to="/create"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4 text-primary-400" />
                          <span>创建角色</span>
                        </Link>
                        <Link
                          to="/profile/self"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-blue-400" />
                          <span>个人中心</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span>账号设置</span>
                        </Link>
                      </div>

                      {/* 退出登录 */}
                      <div className="py-2 border-t border-white/10">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>退出登录</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 transition-all"
              >
                登录
              </Link>
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

// ChevronDown 组件
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

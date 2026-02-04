import { Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

export default function Layout() {
  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-pink-400 bg-clip-text text-transparent">
              SoulEcho
            </span>
          </a>

          <nav className="flex items-center gap-4">
            <ThemeSwitcher />
            <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              首页
            </a>
            <a href="/create" className="px-4 py-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all">
              + 创建角色
            </a>
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

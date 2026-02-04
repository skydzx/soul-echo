import { useEffect } from 'react';
import { Sun, Moon, Heart } from 'lucide-react';
import { useThemeStore, type Theme } from '@/stores/themeStore';

export default function ThemeSwitcher() {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    // 初始化主题
    applyThemeToBody(theme);
  }, [theme]);

  const themes: { value: Theme; icon: typeof Sun; label: string; color: string }[] = [
    { value: 'dark', icon: Moon, label: '深色', color: 'from-gray-600 to-gray-800' },
    { value: 'light', icon: Sun, label: '浅色', color: 'from-yellow-400 to-orange-500' },
    { value: 'pink', icon: Heart, label: '粉色', color: 'from-pink-400 to-rose-500' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;

        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              ${isActive
                ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
            {isActive && <span className="text-xs font-medium">{t.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// 应用主题到 body
function applyThemeToBody(theme: Theme) {
  const body = document.body;

  // 移除所有主题类
  body.classList.remove('theme-dark', 'theme-light', 'theme-pink');

  // 添加当前主题类
  body.classList.add(`theme-${theme}`);
}

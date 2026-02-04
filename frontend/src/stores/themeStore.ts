import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'pink';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const themes: Theme[] = ['dark', 'light', 'pink'];
        const currentIndex = themes.indexOf(get().theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        set({ theme: nextTheme });
        applyTheme(nextTheme);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// 应用主题到 DOM
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // 移除所有主题类
  root.classList.remove('theme-dark', 'theme-light', 'theme-pink');

  // 添加当前主题类
  root.classList.add(`theme-${theme}`);

  // 设置 CSS 变量
  switch (theme) {
    case 'light':
      root.style.setProperty('--color-bg', '#f5f5f5');
      root.style.setProperty('--color-bg-secondary', '#ffffff');
      root.style.setProperty('--color-text', '#1f2937');
      root.style.setProperty('--color-text-secondary', '#6b7280');
      root.style.setProperty('--color-glass', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--color-glass-border', 'rgba(0, 0, 0, 0.1)');
      break;
    case 'pink':
      root.style.setProperty('--color-bg', '#fce7f3');
      root.style.setProperty('--color-bg-secondary', '#ffffff');
      root.style.setProperty('--color-text', '#831843');
      root.style.setProperty('--color-text-secondary', '#be185d');
      root.style.setProperty('--color-glass', 'rgba(255, 255, 255, 0.85)');
      root.style.setProperty('--color-glass-border', 'rgba(219, 39, 119, 0.2)');
      break;
    default:
      // dark
      root.style.setProperty('--color-bg', '#0f0f1a');
      root.style.setProperty('--color-bg-secondary', '#1a1a2e');
      root.style.setProperty('--color-text', '#f3f4f6');
      root.style.setProperty('--color-text-secondary', '#9ca3af');
      root.style.setProperty('--color-glass', 'rgba(26, 26, 46, 0.8)');
      root.style.setProperty('--color-glass-border', 'rgba(255, 255, 255, 0.1)');
  }
}

// 初始化主题
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme-storage');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      applyTheme(parsed.state.theme || 'dark');
    } catch {
      applyTheme('dark');
    }
  } else {
    applyTheme('dark');
  }
}

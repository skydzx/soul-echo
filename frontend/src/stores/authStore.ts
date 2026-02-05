import { create } from 'zustand';
import { authApi, type User } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

// 直接使用 localStorage
const getStorage = (): { user: User | null; token: string | null } => {
  try {
    const data = localStorage.getItem('soul-auth');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
      };
    }
  } catch {
    // ignore
  }
  return { user: null, token: null };
};

const saveAuth = (user: User, token: string) => {
  localStorage.setItem('soul-auth', JSON.stringify({ user, token }));
};

const clearAuth = () => {
  localStorage.removeItem('soul-auth');
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...getStorage(),
  loading: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const response = await authApi.login({ username, password });
      saveAuth(response.user, response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ loading: true });
    try {
      const response = await authApi.register({ username, email, password });
      saveAuth(response.user, response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const user = await authApi.getMe(token);
      set({ user, isAuthenticated: true });
    } catch {
      clearAuth();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

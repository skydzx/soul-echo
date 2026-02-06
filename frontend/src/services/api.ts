import axios from 'axios';
import type { Character, CreateCharacterRequest, ChatRequest, ChatResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加 token 到请求
api.interceptors.request.use((config) => {
  const data = localStorage.getItem('soul-auth');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // zustand persist format: {"state":{"token":...}, "version":0}
      // direct format: {"token":...}
      const token = parsed.state?.token || parsed.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// 角色相关 API
export const characterApi = {
  getAll: () => api.get<Character[]>('/characters').then(res => res.data),
  getById: (id: string) => api.get<Character>(`/characters/${id}`).then(res => res.data),
  create: (data: CreateCharacterRequest) => api.post<Character>('/characters', data).then(res => res.data),
  delete: (id: string) => api.delete(`/characters/${id}`).then(res => res.data),
};

// 对话相关 API
export interface MultimodalChatRequest {
  character_id: string;
  message: string;
  images?: string[];
  stream?: boolean;
}

export interface MultimodalChatResponse {
  character_id: string;
  response: string;
  timestamp: string;
  images?: string[];
}

export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data).then(res => res.data),
  getHistory: (characterId: string) => api.get(`/chat/history/${characterId}`).then(res => res.data),
  sendMultimodal: (data: MultimodalChatRequest) =>
    api.post<MultimodalChatResponse>('/chat/multimodal', data).then(res => res.data),
};

// TTS 语音相关 API
export interface TTSResponse {
  audio_url: string;
  text: string;
}

export const ttsApi = {
  generate: (text: string, gender: string) =>
    api.post<TTSResponse>('/tts', { text, gender }).then(res => res.data),
  getVoices: () => api.get<{ voices: string[] }>('/tts/voices').then(res => res.data),
};

// 头像相关 API
export const avatarApi = {
  upload: (characterId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/characters/${characterId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
  // 带 token 的上传函数（用于创建角色时）
  uploadWithToken: (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/characters/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }).then(res => res.data);
  },
  delete: (characterId: string) =>
    api.delete(`/characters/${characterId}/avatar`).then(res => res.data),
};

// 图片相关 API
export const imageApi = {
  upload: (characterId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/characters/${characterId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
  delete: (characterId: string, filename: string) =>
    api.delete(`/characters/${characterId}/images/${filename}`).then(res => res.data),
  getAll: (characterId: string) =>
    api.get<{ images: { url: string; filename: string }[] }>(`/characters/${characterId}/images`).then(res => res.data),
};

// 记忆相关 API
export interface Memory {
  id: string;
  content: string;
  metadata: {
    type: string;
    importance: number;
    created_at: string;
  };
  distance?: number;
}

export const memoryApi = {
  getMemories: (characterId: string, limit: number = 10) =>
    api.get<{ count: number; memories: Memory[] }>(`/characters/${characterId}/memories`, {
      params: { limit }
    }).then(res => res.data),

  addMemory: (characterId: string, content: string, memoryType: string = "对话", importance: number = 5) =>
    api.post<{ id: string; message: string }>(`/characters/${characterId}/memories`, {
      character_id: characterId,
      content,
      memory_type: memoryType,
      importance
    }).then(res => res.data),

  searchMemories: (characterId: string, query: string, nResults: number = 5) =>
    api.post<{ count: number; memories: Memory[] }>(`/characters/${characterId}/memories/search`, {
      character_id: characterId,
      query,
      n_results: nResults
    }).then(res => res.data),

  deleteMemory: (characterId: string, memoryId: string) =>
    api.delete(`/characters/${characterId}/memories/${memoryId}`).then(res => res.data),

  clearMemories: (characterId: string) =>
    api.delete(`/characters/${characterId}/memories`).then(res => res.data),

  getCount: (characterId: string) =>
    api.get<{ count: number }>(`/characters/${characterId}/memories/count`).then(res => res.data),
};

// AI生成相关 API
export interface GenerateNameRequest {
  gender: string;
  relationship_type: string;
  preferences?: string;
}

export interface GenerateNameResponse {
  names: string[];
  reasons: string[];
}

export interface GenerateAppearanceRequest {
  gender: string;
  relationship_type: string;
  preferences?: string;
}

export interface GenerateAppearanceResponse {
  appearance: string;
  style_tips: string[];
}

export const generateApi = {
  // 生成角色名字
  generateName: (data: GenerateNameRequest) =>
    api.post<GenerateNameResponse>('/generate/name', data).then(res => res.data),

  // 生成外貌特征
  generateAppearance: (data: GenerateAppearanceRequest) =>
    api.post<GenerateAppearanceResponse>('/generate/appearance', data).then(res => res.data),
};

// 认证相关 API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then(res => res.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then(res => res.data),

  getMe: (token: string) =>
    api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),
};

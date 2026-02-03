import axios from 'axios';
import type { Character, CreateCharacterRequest, ChatRequest, ChatResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 角色相关 API
export const characterApi = {
  getAll: () => api.get<Character[]>('/characters').then(res => res.data),
  getById: (id: string) => api.get<Character>(`/characters/${id}`).then(res => res.data),
  create: (data: CreateCharacterRequest) => api.post<Character>('/characters', data).then(res => res.data),
  delete: (id: string) => api.delete(`/characters/${id}`).then(res => res.data),
};

// 对话相关 API
export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data).then(res => res.data),
  getHistory: (characterId: string) => api.get(`/chat/history/${characterId}`).then(res => res.data),
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
  delete: (characterId: string) =>
    api.delete(`/characters/${characterId}/avatar`).then(res => res.data),
};

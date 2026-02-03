import { create } from 'zustand';
import type { Character } from '@/types';
import { characterApi } from '@/services/api';

interface CharacterStore {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  error: string | null;
  fetchCharacters: () => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  createCharacter: (data: any) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  currentCharacter: null,
  loading: false,
  error: null,

  fetchCharacters: async () => {
    set({ loading: true, error: null });
    try {
      const characters = await characterApi.getAll();
      set({ characters, loading: false });
    } catch (error) {
      set({ error: '获取角色列表失败', loading: false });
    }
  },

  setCurrentCharacter: (character) => {
    set({ currentCharacter: character });
  },

  createCharacter: async (data) => {
    set({ loading: true, error: null });
    try {
      const character = await characterApi.create(data);
      set((state) => ({
        characters: [...state.characters, character],
        loading: false,
      }));
      return character;
    } catch (error) {
      set({ error: '创建角色失败', loading: false });
      throw error;
    }
  },

  deleteCharacter: async (id) => {
    try {
      await characterApi.delete(id);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
      }));
    } catch (error) {
      set({ error: '删除角色失败' });
    }
  },
}));

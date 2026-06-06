import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';

const CHAT_KEY = '@nutriscan_chat';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  loadMessages: () => Promise<void>;
  addMessage: (msg: ChatMessage) => Promise<void>;
  setTyping: (val: boolean) => void;
  clearChat: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,

  loadMessages: async () => {
    try {
      const raw = await AsyncStorage.getItem(CHAT_KEY);
      if (raw) set({ messages: JSON.parse(raw) });
    } catch {}
  },

  addMessage: async (msg) => {
    const updated = [...get().messages, msg];
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated));
    set({ messages: updated });
  },

  setTyping: (val) => set({ isTyping: val }),

  clearChat: async () => {
    await AsyncStorage.removeItem(CHAT_KEY);
    set({ messages: [] });
  },
}));

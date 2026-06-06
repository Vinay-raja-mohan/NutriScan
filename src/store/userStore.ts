import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const STORAGE_KEY = '@nutriscan_user_profile';

interface UserState {
  profile: UserProfile | null;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboardingComplete: false,
  isLoading: true,

  setProfile: async (profile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    set({ profile, isOnboardingComplete: profile.onboardingComplete });
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({
      profile: updated,
      ...(updates.onboardingComplete !== undefined ? { isOnboardingComplete: updates.onboardingComplete } : {})
    });
  },

  loadProfile: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const profile: UserProfile = JSON.parse(raw);
        set({ profile, isOnboardingComplete: profile.onboardingComplete, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearProfile: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ profile: null, isOnboardingComplete: false });
  },

  completeOnboarding: () => {
    set({ isOnboardingComplete: true });
  },
}));

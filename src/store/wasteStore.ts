import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WasteTracker } from '../types';

const WASTE_KEY = '@nutriscan_waste';

interface WasteState {
  tracker: WasteTracker | null;
  loadTracker: () => Promise<void>;
  addWasteSaved: (meals: number, grams: number, costINR: number) => Promise<void>;
  resetWeek: (userId: string) => Promise<void>;
}

export const useWasteStore = create<WasteState>((set, get) => ({
  tracker: null,

  loadTracker: async () => {
    try {
      const raw = await AsyncStorage.getItem(WASTE_KEY);
      if (raw) set({ tracker: JSON.parse(raw) });
    } catch {}
  },

  addWasteSaved: async (meals, grams, costINR) => {
    const current = get().tracker;
    if (!current) return;
    const updated: WasteTracker = {
      ...current,
      mealsFromPantry: current.mealsFromPantry + meals,
      weightSavedGrams: current.weightSavedGrams + grams,
      moneySavedINR: current.moneySavedINR + costINR,
      co2AvoidedKg: current.co2AvoidedKg + grams * 0.0025,
    };
    await AsyncStorage.setItem(WASTE_KEY, JSON.stringify(updated));
    set({ tracker: updated });
  },

  resetWeek: async (userId) => {
    const fresh: WasteTracker = {
      userId,
      weekOf: new Date().toISOString().split('T')[0],
      mealsFromPantry: 0,
      weightSavedGrams: 0,
      moneySavedINR: 0,
      co2AvoidedKg: 0,
    };
    await AsyncStorage.setItem(WASTE_KEY, JSON.stringify(fresh));
    set({ tracker: fresh });
  },
}));

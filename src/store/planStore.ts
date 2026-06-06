import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyDietPlan, DayKey, MealType, MealStatus, WaterLog, ShoppingItem } from '../types';

const PLAN_KEY = '@nutriscan_diet_plan';
const WATER_KEY = '@nutriscan_water_log';
const SHOPPING_KEY = '@nutriscan_shopping_list';

interface PlanState {
  weeklyPlan: WeeklyDietPlan | null;
  waterLog: WaterLog[];
  shoppingList: ShoppingItem[];
  todayWaterGlasses: number;
  isGenerating: boolean;
  setPlan: (plan: WeeklyDietPlan) => Promise<void>;
  loadPlan: () => Promise<void>;
  updateMealStatus: (day: DayKey, meal: MealType, status: MealStatus) => Promise<void>;
  setWater: (glasses: number) => Promise<void>;
  loadWater: () => Promise<void>;
  setShoppingList: (list: ShoppingItem[]) => Promise<void>;
  loadShoppingList: () => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  setGenerating: (val: boolean) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  weeklyPlan: null,
  waterLog: [],
  shoppingList: [],
  todayWaterGlasses: 0,
  isGenerating: false,

  setPlan: async (plan) => {
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    set({ weeklyPlan: plan });
  },

  loadPlan: async () => {
    try {
      const raw = await AsyncStorage.getItem(PLAN_KEY);
      if (raw) set({ weeklyPlan: JSON.parse(raw) });
    } catch {}
  },

  updateMealStatus: async (day, meal, status) => {
    const plan = get().weeklyPlan;
    if (!plan) return;
    const updated = {
      ...plan,
      days: {
        ...plan.days,
        [day]: {
          ...plan.days[day],
          [meal]: { ...plan.days[day][meal], status },
        },
      },
    };
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(updated));
    set({ weeklyPlan: updated });
  },

  setWater: async (glasses) => {
    const today = new Date().toISOString().split('T')[0];
    const log = get().waterLog.filter(w => w.date !== today);
    const updated = [...log, { date: today, glasses }];
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(updated));
    set({ waterLog: updated, todayWaterGlasses: glasses });
  },

  loadWater: async () => {
    try {
      const raw = await AsyncStorage.getItem(WATER_KEY);
      if (raw) {
        const log: WaterLog[] = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        const todayLog = log.find(w => w.date === today);
        set({ waterLog: log, todayWaterGlasses: todayLog?.glasses ?? 0 });
      }
    } catch {}
  },

  setShoppingList: async (list) => {
    await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
    set({ shoppingList: list });
  },

  loadShoppingList: async () => {
    try {
      const raw = await AsyncStorage.getItem(SHOPPING_KEY);
      if (raw) set({ shoppingList: JSON.parse(raw) });
    } catch {}
  },

  toggleShoppingItem: async (id) => {
    const list = get().shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
    set({ shoppingList: list });
  },

  setGenerating: (val) => set({ isGenerating: val }),
}));

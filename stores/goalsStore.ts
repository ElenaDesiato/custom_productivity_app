import { Goal, SelfCareArea, UserSettings } from '@/types/goals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SETTINGS_KEY = 'goals_settings';
const GOALS_KEY = 'goals';
const AREAS_KEY = 'selfcare_areas';
const DEFAULT_AREAS: SelfCareArea[] = [
  { id: 'movement', name: 'Movement', icon: 'directions-run', color: '#4CAF50' },
  { id: 'self-kindness', name: 'Self-Kindness', icon: 'favorite', color: '#FFD600' },
  { id: 'nutrition', name: 'Nutrition', icon: 'restaurant', color: '#FF8A65' },
  { id: 'hygiene', name: 'Hygiene', icon: 'water-drop', color: '#2196F3' },
  { id: 'productivity', name: 'Productivity', icon: 'work', color: '#9575CD' },
  { id: 'human-connection', name: 'Human Connection', icon: 'people', color: '#F06292' },
  { id: 'personal', name: 'Personal', icon: 'person', color: '#A1887F' },
];

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function getSunday(date: Date) {
  const monday = getMonday(date);
  return new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
}
function isDateInCurrentWeek(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const weekStart = getMonday(now);
  const weekEnd = getSunday(now);
  return date >= weekStart && date <= weekEnd;
}

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  streak: number;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reloadGoals: () => Promise<void>;
  // Internal helpers for store
  getDailyGoal: () => Promise<number>;
  calculateStreak: (goalsList: Goal[]) => Promise<void>;
  saveGoals: (newGoals: Goal[]) => Promise<void>;

  // Self-care areas
  areas: SelfCareArea[];
  areasLoading: boolean;
  addArea: (area: SelfCareArea) => Promise<void>;
  updateArea: (area: SelfCareArea) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  reloadAreas: () => Promise<void>;

  // User settings
  userSettings: Omit<UserSettings, 'currentStreak' | 'highestStreak'>;
  userSettingsLoading: boolean;
  reloadUserSettings: () => Promise<void>;
  updateUserSettings: (settings: Partial<Omit<UserSettings, 'currentStreak' | 'highestStreak'>>) => Promise<void>;

  // Weekly goals
  weeklyGoals: { [areaId: string]: string };
  setWeeklyGoal: (areaId: string, value: string) => Promise<void>;
  reloadWeeklyGoals: () => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  // Weekly goals
  weeklyGoals: {},
  reloadWeeklyGoals: async () => {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      set({ weeklyGoals: parsed.weeklyGoals || {} });
    }
  },
  setWeeklyGoal: async (areaId, value) => {
    // Update in store
    const current = get().weeklyGoals || {};
    const updated = { ...current, [areaId]: value };
    set({ weeklyGoals: updated });
    // Persist to AsyncStorage (merge with other settings)
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    let parsed = data ? JSON.parse(data) : {};
    parsed.weeklyGoals = updated;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  },
  // User settings
  userSettings: {
    dailyPointGoal: 20,
    lastCompletionDate: null,
  },
  userSettingsLoading: true,
  reloadUserSettings: async () => {
    set({ userSettingsLoading: true });
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      set((state) => ({
        userSettings: {
          dailyPointGoal: Number(parsed.dailyGoal) || 20,
          lastCompletionDate: parsed.lastCompletionDate || null,
        },
        weeklyGoals: parsed.weeklyGoals || {},
        streak: Number(parsed.streak) || 0,
      }));
    }
    set({ userSettingsLoading: false });
  },
  updateUserSettings: async (settings) => {
  const current = get().userSettings;
  const updated = { ...current, ...settings };
  set({ userSettings: updated });
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  let parsed = data ? JSON.parse(data) : {};
  parsed.dailyGoal = updated.dailyPointGoal;
  parsed.lastCompletionDate = updated.lastCompletionDate;
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  },
  goals: [],
  loading: true,
  streak: 0,
  areas: [],
  areasLoading: true,
  // Self-care area actions
  reloadAreas: async () => {
    set({ areasLoading: true });
    const data = await AsyncStorage.getItem(AREAS_KEY);
    if (data) {
      set({ areas: JSON.parse(data) });
    } else {
      set({ areas: DEFAULT_AREAS });
    }
    set({ areasLoading: false });
  },

  addArea: async (area) => {
    const current = get().areas;
    const updated = [...current, area];
    set({ areas: updated });
    await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
  },

  updateArea: async (area) => {
    const updated = get().areas.map(a => a.id === area.id ? area : a);
    set({ areas: updated });
    await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
  },

  deleteArea: async (id) => {
    // Remove area
    const updatedAreas = get().areas.filter(a => a.id !== id);
    set({ areas: updatedAreas });
    await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updatedAreas));
    // Remove all goals for this area
    const filteredGoals = get().goals.filter(g => g.areaId !== id);
    set({ goals: filteredGoals });
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(filteredGoals));
    // Recalculate streak, etc.
    await get().reloadGoals();
  },

  reloadGoals: async () => {
    set({ loading: true });
    const data = await AsyncStorage.getItem(GOALS_KEY);
    if (data) {
      const loadedGoals = JSON.parse(data).map((goal: any) => ({
        ...goal,
        completedDates: goal.completedDates || [],
      }));
      set({ goals: loadedGoals });
      await get().calculateStreak(loadedGoals);
    }
    set({ loading: false });
  },

  addGoal: (goal) => {
    set((state) => {
      const updatedGoals = [...state.goals, goal];
      setTimeout(() => {
        AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
      }, 0);
      return { goals: updatedGoals };
    });
  },

  updateGoal: async (updated) => {
    const pruned = {
      ...updated,
      completedDates: updated.completedDates || [],
    };
    const newGoals = get().goals.map(g => g.id === updated.id ? pruned : g);
    set({ goals: newGoals });
    await get().calculateStreak(newGoals);
    await get().saveGoals(newGoals);
  },

  deleteGoal: async (id) => {
    const newGoals = get().goals.filter(g => g.id !== id);
    await get().saveGoals(newGoals);
    set({ goals: newGoals });
  },

  // Helper to get daily goal from settings
  getDailyGoal: async () => {
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        return Number(parsed.dailyGoal) || 20;
      } catch {
        return 20;
      }
    }
    return 20;
  },

  calculateStreak: async (goalsList: Goal[]) => {
    const dailyGoal = await get().getDailyGoal();
    let streakCount = 0;
  // Always use local date for today, matching UI
    let now = new Date();
    now.setHours(0,0,0,0);
    let date = new Date(now);

    // Helper to get local YYYY-MM-DD string
    function toLocalYMD(d: Date) {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    let firstDay = true;
    while (true) {
  const dateStr = toLocalYMD(date);
      const points = goalsList.reduce((sum, goal) =>
        goal.completedDates?.includes(dateStr) ? sum + goal.points : sum
      , 0);
      if (points >= dailyGoal) {
        streakCount++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    set({ streak: streakCount });
    // Persist streak for backup only
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    let parsed: any = {};
    if (settings) {
      try { parsed = { ...JSON.parse(settings) }; } catch { parsed = {}; }
    }
    parsed.streak = streakCount;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  },

  saveGoals: async (newGoals: Goal[]) => {
    set({ goals: newGoals });
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
  },

  // On store init, load goals, areas, and user settings
  _init: (() => {
    (async () => {
      // Load goals
      const data = await AsyncStorage.getItem(GOALS_KEY);
      if (data) {
        const loadedGoals = JSON.parse(data).map((goal: any) => ({
          ...goal,
          completedDates: (goal.completedDates || []).filter(isDateInCurrentWeek),
        }));
        set({ goals: loadedGoals });
        await get().calculateStreak(loadedGoals);
      }
      set({ loading: false });
      // Load areas
      const areaData = await AsyncStorage.getItem(AREAS_KEY);
      if (areaData) {
        set({ areas: JSON.parse(areaData) });
      } else {
        set({ areas: DEFAULT_AREAS });
      }
      set({ areasLoading: false });
      // Load user settings
      const settingsData = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsData) {
        const parsed = JSON.parse(settingsData);
        set({
          userSettings: {
            dailyPointGoal: Number(parsed.dailyGoal) || 20,
            lastCompletionDate: parsed.lastCompletionDate || null,
          },
          streak: Number(parsed.streak) || 0,
        });
      }
      set({ userSettingsLoading: false });
    })();
    return undefined;
  })(),
}));

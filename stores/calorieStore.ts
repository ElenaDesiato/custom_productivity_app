import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Meal = {
  id: string;
  description: string;
  grams: number;
  caloriesPer100g: number;
  totalCalories: number;
  date: string; // YYYY-MM-DD
  isFavourite?: boolean;
};

export type CalorieGoal = {
  value: number;
  isCustom: boolean;
};

interface CalorieStore {
  meals: Meal[];
  favourites: Meal[];
  goal: CalorieGoal | null;
  load: () => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  updateMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  setGoal: (goal: CalorieGoal) => Promise<void>;
  addFavourite: (meal: Meal) => Promise<void>;
  removeFavourite: (id: string) => Promise<void>;
}

const MEALS_KEY = 'calorie_meals';
const FAVS_KEY = 'calorie_favourites';
const GOAL_KEY = 'calorie_goal';

export const useCalorieStore = create<CalorieStore>((set, get) => ({
  meals: [],
  favourites: [],
  goal: null,
  load: async () => {
    const [meals, favourites, goal] = await Promise.all([
      AsyncStorage.getItem(MEALS_KEY),
      AsyncStorage.getItem(FAVS_KEY),
      AsyncStorage.getItem(GOAL_KEY),
    ]);
    set({
      meals: meals ? JSON.parse(meals) : [],
      favourites: favourites ? JSON.parse(favourites) : [],
      goal: goal ? JSON.parse(goal) : null,
    });
  },
  addMeal: async (meal) => {
    const meals = [...get().meals, meal];
    set({ meals });
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  },
  updateMeal: async (meal) => {
    const meals = get().meals.map(m => m.id === meal.id ? meal : m);
    set({ meals });
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  },
  deleteMeal: async (id) => {
    const meals = get().meals.filter(m => m.id !== id);
    set({ meals });
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  },
  setGoal: async (goal) => {
    set({ goal });
    await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  },
  addFavourite: async (meal) => {
    const favourites = [...get().favourites, meal];
    set({ favourites });
    await AsyncStorage.setItem(FAVS_KEY, JSON.stringify(favourites));
  },
  removeFavourite: async (id) => {
    const favourites = get().favourites.filter(m => m.id !== id);
    set({ favourites });
    await AsyncStorage.setItem(FAVS_KEY, JSON.stringify(favourites));
  },
}));

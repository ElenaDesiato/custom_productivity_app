import { Goal } from '@/types/goals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
const SETTINGS_KEY = 'goals_settings';


const GOALS_KEY = 'goals';

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

export function useGoals() {
  // Expose reloadGoals for manual reloads
  const reloadGoals = useCallback(async () => {
    setLoading(true);
    const data = await AsyncStorage.getItem(GOALS_KEY);
    if (data) {
      const loadedGoals = JSON.parse(data).map((goal: any) => ({
        ...goal,
        completedDates: (goal.completedDates || []).filter(isDateInCurrentWeek),
      }));
      setGoals(loadedGoals);
      await calculateStreak(loadedGoals);
    }
    setLoading(false);
  }, []);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // Helper to get daily goal from settings
  const getDailyGoal = async () => {
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
  };

  // Calculate streak: number of consecutive days (up to yesterday) where daily goal was reached
  const calculateStreak = async (goalsList: Goal[]) => {
    const dailyGoal = await getDailyGoal();
    let streakCount = 0;
    let date = new Date();
    date.setHours(0,0,0,0);
    // Always treat Monday as 0, Sunday as 6 for consistency
    while (true) {
      const dateStr = date.toISOString().slice(0, 10);
      const points = goalsList.reduce((sum, goal) =>
        goal.completedDates?.includes(dateStr) ? sum + goal.points : sum
      , 0);
      if (points >= dailyGoal) {
        streakCount++;
        // Move to previous day, always using local time
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(streakCount);
    // Save streak to settings
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    let parsed: any = { currentStreak: 0 };
    if (settings) {
      try { parsed = { ...JSON.parse(settings) }; } catch { parsed = { currentStreak: 0 }; }
    }
    parsed.currentStreak = streakCount;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  };

  // Load goals from storage on mount
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(GOALS_KEY)
      .then(async data => {
        if (isMounted && data) {
          // Prune completedDates to only current week
          const loadedGoals = JSON.parse(data).map((goal: any) => ({
            ...goal,
            completedDates: (goal.completedDates || []).filter(isDateInCurrentWeek),
          }));
          setGoals(loadedGoals);
          // Save pruned goals back to storage
          AsyncStorage.setItem(GOALS_KEY, JSON.stringify(loadedGoals));
          await calculateStreak(loadedGoals);
        }
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save goals to storage
  const saveGoals = useCallback(async (newGoals: Goal[]) => {
    setGoals(newGoals);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
  }, []);

  const addGoal = useCallback((goal: Goal) => {
    setGoals(prevGoals => {
      const updatedGoals = [...prevGoals, goal];
      setTimeout(() => {
        AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
      }, 0);
      return updatedGoals;
    });
  }, []);


  const updateGoal = useCallback(async (updated: Goal) => {
    // Prune completedDates to only current week before saving
    const pruned = {
      ...updated,
      completedDates: (updated.completedDates || []).filter(isDateInCurrentWeek),
    };
    const newGoals = goals.map(g => g.id === updated.id ? pruned : g);
    setGoals(newGoals); // Update UI immediately
    await calculateStreak(newGoals); // Update streak immediately
    await saveGoals(newGoals);
    // Optionally reload from storage for consistency
    const data = await AsyncStorage.getItem(GOALS_KEY);
    if (data) {
      const loadedGoals = JSON.parse(data).map((goal: any) => ({
        ...goal,
        completedDates: (goal.completedDates || []).filter(isDateInCurrentWeek),
      }));
      setGoals(loadedGoals);
      await calculateStreak(loadedGoals);
    }
  }, [goals, saveGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    await saveGoals(goals.filter(g => g.id !== id));
  }, [goals, saveGoals]);

  return { goals, loading, addGoal, updateGoal, deleteGoal, streak, reloadGoals };
}

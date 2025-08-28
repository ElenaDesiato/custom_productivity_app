import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const SETTINGS_KEY = 'goals_settings';

export interface UserSettings {
  dailyGoal: number;
  currentStreak: number;
  highestStreak: number;
  lastCompletionDate: string | null;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    dailyGoal: 20,
    currentStreak: 0,
    highestStreak: 0,
    lastCompletionDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = () => {
      AsyncStorage.getItem(SETTINGS_KEY).then(data => {
        if (isMounted && data) {
          const parsed = JSON.parse(data);
          setSettings({
            dailyGoal: Number(parsed.dailyGoal) || 20,
            currentStreak: Number(parsed.currentStreak) || 0,
            highestStreak: Number(parsed.highestStreak) || 0,
            lastCompletionDate: parsed.lastCompletionDate || null,
          });
        }
        if (isMounted) setLoading(false);
      });
    };
    loadSettings();
    // Listen for storage events (cross-tab)
    window?.addEventListener?.('storage', loadSettings);
    // Monkey-patch AsyncStorage.setItem for same-tab updates
    const origSetItem = AsyncStorage.setItem;
    AsyncStorage.setItem = async (...args) => {
      const result = await origSetItem.apply(AsyncStorage, args);
      loadSettings();
      return result;
    };
    return () => {
      isMounted = false;
      window?.removeEventListener?.('storage', loadSettings);
      AsyncStorage.setItem = origSetItem;
    };
  }, []);

  return { settings, loading };
}

import { Goal, SelfCareArea } from '@/types/goals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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

export function useSelfCareAreas() {
  const [areas, setAreas] = useState<SelfCareArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAreas = () => {
      AsyncStorage.getItem(AREAS_KEY)
        .then(data => {
          if (isMounted) {
            if (data) setAreas(JSON.parse(data));
            else setAreas(DEFAULT_AREAS);
          }
        })
        .finally(() => { if (isMounted) setLoading(false); });
    };
    loadAreas();
    const listener = () => loadAreas();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', listener);
    }
    // Monkey-patch AsyncStorage.setItem to also trigger the listener (for same-tab updates)
    const origSetItem = AsyncStorage.setItem;
    AsyncStorage.setItem = async (...args) => {
      const result = await origSetItem.apply(AsyncStorage, args);
      listener();
      return result;
    };
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('storage', listener);
      }
      AsyncStorage.setItem = origSetItem;
    };
  }, []);

  const saveAreas = useCallback(async (newAreas: SelfCareArea[]) => {
    setAreas(newAreas);
    await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(newAreas));
  }, []);

  const addArea = useCallback(async (area: SelfCareArea) => {
    await saveAreas([...areas, area]);
  }, [areas, saveAreas]);

  const updateArea = useCallback(async (updated: SelfCareArea) => {
    await saveAreas(areas.map(a => a.id === updated.id ? updated : a));
  }, [areas, saveAreas]);

  const deleteArea = useCallback(async (id: string) => {
    // Remove area
    await saveAreas(areas.filter(a => a.id !== id));
    // Remove all goals for this area
    const GOALS_KEY = 'goals';
    const goalsRaw = await AsyncStorage.getItem(GOALS_KEY);
    if (goalsRaw) {
      const goals: Goal[] = JSON.parse(goalsRaw);
      const filtered = goals.filter(g => g.areaId !== id);
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(filtered));
    }
  }, [areas, saveAreas]);

  return { areas, loading, addArea, updateArea, deleteArea };
}

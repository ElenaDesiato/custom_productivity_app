import { WeightEntry } from '@/app/(tabs)/health/weightTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_ENTRIES_KEY = 'weight_entries';

export async function saveWeightEntries(entries: WeightEntry[]) {
  await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
}

export async function loadWeightEntries(): Promise<WeightEntry[]> {
  const data = await AsyncStorage.getItem(WEIGHT_ENTRIES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

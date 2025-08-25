import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListerState } from '../types/lister';

const STORAGE_KEY = 'lister_state_v1';

export async function loadListerState(): Promise<ListerState | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export async function saveListerState(state: ListerState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // handle error
  }
}

export function getInitialListerState(): ListerState {
  return {
    lists: [],
    lastId: 0,
    selectedListId: null,
  };
}

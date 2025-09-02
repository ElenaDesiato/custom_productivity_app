import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { ListerCategory, ListerItem, ListerList, ListerState as ListerStateType } from '../types/lister';

const STORAGE_KEY = 'lister_state_v1';

function getInitialListerState(): ListerStateType {
  return {
    lists: [],
    lastId: 0,
    selectedListId: null,
  };
}

interface ListerStoreState extends ListerStateType {
  loading: boolean;
  loadState: () => Promise<void>;
  saveState: (state?: Partial<ListerStateType>) => Promise<void>;
  createList: (name: string, color?: string) => void;
  renameList: (listId: number, name: string) => void;
  updateListColor: (listId: number, color: string) => void;
  deleteList: (listId: number) => void;
  addCategory: (listId: number, name: string) => void;
  renameCategory: (listId: number, categoryId: number, name: string) => void;
  deleteCategory: (listId: number, categoryId: number) => void;
  addItem: (listId: number, name: string, categoryId: number | null) => void;
  deleteItem: (listId: number, itemId: number) => void;
  toggleItemInCart: (listId: number, itemId: number) => void;
  reorderCategories: (listId: number, newOrder: number[]) => void;
  reorderItems: (listId: number, newOrder: number[]) => void;
  moveItemToCategory: (listId: number, itemId: number, newCategoryId: number | null) => void;
  selectList: (listId: number) => void;
}

export const useListerStore = create<ListerStoreState>((set, get) => ({
  ...getInitialListerState(),
  loading: true,

  loadState: async () => {
    set({ loading: true });
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const loaded = JSON.parse(json);
        set({ ...getInitialListerState(), ...loaded, loading: false });
      } else {
        set({ ...getInitialListerState(), loading: false });
      }
    } catch {
      set({ ...getInitialListerState(), loading: false });
    }
  },
  saveState: async (partial) => {
    const state = { ...get(), ...partial };
    set(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      lists: state.lists,
      lastId: state.lastId,
      selectedListId: state.selectedListId,
    }));
  },

  createList: (name, color = '#22292f') => {
    const id = get().lastId + 1;
    const otherCat: ListerCategory = { id: id + 1, name: 'Other', order: 0, isSpecial: true, isOther: true };
    const cartCat: ListerCategory = { id: id + 2, name: 'In shopping cart', order: 1, isSpecial: true, isShoppingCart: true };
    const newList: ListerList = {
      id,
      name,
      color,
      categories: [otherCat, cartCat],
      items: [],
    };
    const newState = {
      ...get(),
      lists: [...get().lists, newList],
      lastId: id + 2,
      selectedListId: id,
    };
    get().saveState(newState);
  },
  renameList: (listId, name) => {
    const lists = get().lists.map(l => l.id === listId ? { ...l, name } : l);
    get().saveState({ lists });
  },
  updateListColor: (listId, color) => {
    const lists = get().lists.map(l => l.id === listId ? { ...l, color } : l);
    get().saveState({ lists });
  },
  deleteList: (listId) => {
    const lists = get().lists.filter(l => l.id !== listId);
    get().saveState({ lists });
  },
  addCategory: (listId, name) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      const newCatId = get().lastId + 1;
      const newCat: ListerCategory = { id: newCatId, name, order: l.categories.length };
      return { ...l, categories: [...l.categories, newCat] };
    });
    get().saveState({ lists, lastId: get().lastId + 1 });
  },
  renameCategory: (listId, categoryId, name) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        categories: l.categories.map(c => c.id === categoryId ? { ...c, name } : c),
      };
    });
    get().saveState({ lists });
  },
  deleteCategory: (listId, categoryId) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        categories: l.categories.filter(c => c.id !== categoryId),
        items: l.items.map(i => i.categoryId === categoryId ? { ...i, categoryId: null } : i),
      };
    });
    get().saveState({ lists });
  },
  addItem: (listId, name, categoryId) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      const newItemId = get().lastId + 1;
      const newItem: ListerItem = { id: newItemId, name, categoryId, inCart: false, order: l.items.length };
      return { ...l, items: [...l.items, newItem] };
    });
    get().saveState({ lists, lastId: get().lastId + 1 });
  },
  deleteItem: (listId, itemId) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.filter(i => i.id !== itemId) };
    });
    get().saveState({ lists });
  },
  toggleItemInCart: (listId, itemId) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        items: l.items.map(i => i.id === itemId ? { ...i, inCart: !i.inCart } : i),
      };
    });
    get().saveState({ lists });
  },
  reorderCategories: (listId, newOrder) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        categories: newOrder.map((catId, idx) => {
          const cat = l.categories.find(c => c.id === catId);
          return cat ? { ...cat, order: idx } : null;
        }).filter(Boolean) as ListerCategory[],
      };
    });
    get().saveState({ lists });
  },
  reorderItems: (listId, newOrder) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        items: newOrder.map((itemId, idx) => {
          const item = l.items.find(i => i.id === itemId);
          return item ? { ...item, order: idx } : null;
        }).filter(Boolean) as ListerItem[],
      };
    });
    get().saveState({ lists });
  },
  moveItemToCategory: (listId, itemId, newCategoryId) => {
    const lists = get().lists.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        items: l.items.map(i => i.id === itemId ? { ...i, categoryId: newCategoryId } : i),
      };
    });
    get().saveState({ lists });
  },
  selectList: (listId) => {
    set({ selectedListId: listId });
    get().saveState({ selectedListId: listId });
  },
}));

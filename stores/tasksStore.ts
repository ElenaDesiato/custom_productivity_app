
import { Task, TaskList } from '@/types/organization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const TASKS_KEY = 'organization_tasks';
const LISTS_KEY = 'organization_lists';

interface TasksState {
  tasks: Task[];
  lists: TaskList[];
  loading: boolean;
  reloadTasks: () => Promise<void>;
  reloadLists: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => Promise<void>;
  addList: (list: TaskList) => Promise<void>;
  updateList: (list: TaskList) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  setLists: (lists: TaskList[]) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  lists: [],
  loading: true,

  reloadTasks: async () => {
    set({ loading: true });
    const data = await AsyncStorage.getItem(TASKS_KEY);
    set({ tasks: data ? JSON.parse(data) : [], loading: false });
  },
  reloadLists: async () => {
    const data = await AsyncStorage.getItem(LISTS_KEY);
    set({ lists: data ? JSON.parse(data) : [] });
  },

  addTask: async (task) => {
    const updated = [...get().tasks, task];
    set({ tasks: updated });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  },
  updateTask: async (task) => {
    const updated = get().tasks.map(t => t.id === task.id ? task : t);
    set({ tasks: updated });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  },
  deleteTask: async (id) => {
    const updated = get().tasks.filter(t => t.id !== id);
    set({ tasks: updated });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  },
  setTasks: async (tasks) => {
    set({ tasks });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  addList: async (list) => {
    const updated = [...get().lists, list];
    set({ lists: updated });
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  },
  updateList: async (list) => {
    const updated = get().lists.map(l => l.id === list.id ? list : l);
    set({ lists: updated });
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  },
  deleteList: async (id) => {
    const updated = get().lists.filter(l => l.id !== id);
    set({ lists: updated });
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
    // Optionally, update tasks whose list was deleted
    const updatedTasks = get().tasks.map(t => {
      if (t.listId === id && t.archived) {
        return { ...t, listId: `deleted-${id}`, deletedList: true };
      } else if (t.listId === id) {
        return null;
      }
      return t;
    }).filter(Boolean) as Task[];
    set({ tasks: updatedTasks });
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
  },
  setLists: async (lists) => {
    set({ lists });
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  },
}));

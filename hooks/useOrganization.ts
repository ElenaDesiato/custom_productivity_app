import { Task, TaskList } from '@/types/organization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEYS = {
  TASKS: 'organization_tasks',
  LISTS: 'organization_lists',
};

export function useOrganization() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [tasksData, listsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.LISTS),
      ]);
      setTasks(tasksData ? JSON.parse(tasksData) : []);
      setLists(listsData ? JSON.parse(listsData) : []);
      setLoading(false);
    })();
  }, []);

  // Save tasks to storage
  const saveTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  }, []);

  // Save lists to storage
  const saveLists = useCallback((newLists: TaskList[]) => {
    setLists(newLists);
    AsyncStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(newLists));
  }, []);

  return {
    tasks,
    setTasks: saveTasks,
    lists,
    setLists: saveLists,
    loading,
  };
}

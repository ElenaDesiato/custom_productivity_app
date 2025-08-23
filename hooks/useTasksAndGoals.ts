import {
  DailyProgress,
  DEFAULT_GOAL_CATEGORIES,
  Goal,
  GoalCategory,
  GoalCompletion,
  TodoTask,
  UserSettings
} from '@/types/tasksAndGoals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
// Simple ID generator for React Native compatibility
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const STORAGE_KEYS = {
  TASKS: 'tasksAndGoals_tasks',
  GOALS: 'tasksAndGoals_goals',
  GOAL_COMPLETIONS: 'tasksAndGoals_goalCompletions',
  CATEGORIES: 'tasksAndGoals_categories',
  DAILY_PROGRESS: 'tasksAndGoals_dailyProgress',
  SETTINGS: 'tasksAndGoals_settings',
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyPointTarget: 25,
  defaultGoalPoints: 5,
};

export function useTasksAndGoals() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalCompletions, setGoalCompletions] = useState<GoalCompletion[]>([]);
  const [categories, setCategories] = useState<GoalCategory[]>(DEFAULT_GOAL_CATEGORIES);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        tasksData,
        goalsData,
        completionsData,
        categoriesData,
        progressData,
        settingsData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.GOAL_COMPLETIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (tasksData) {
        const parsedTasks = JSON.parse(tasksData);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          archivedAt: task.archivedAt ? new Date(task.archivedAt) : undefined,
          repetition: task.repetition ? {
            ...task.repetition,
            lastCompleted: task.repetition.lastCompleted ? new Date(task.repetition.lastCompleted) : undefined,
          } : undefined,
        }));
        setTasks(tasksWithDates);
      }

      if (goalsData) {
        const parsedGoals = JSON.parse(goalsData);
        const goalsWithDates = parsedGoals.map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
        }));
        setGoals(goalsWithDates);
      }

      if (completionsData) {
        const parsedCompletions = JSON.parse(completionsData);
        const completionsWithDates = parsedCompletions.map((completion: any) => ({
          ...completion,
          completedAt: new Date(completion.completedAt),
        }));
        setGoalCompletions(completionsWithDates);
      }

      if (categoriesData) {
        setCategories(JSON.parse(categoriesData));
      }

      if (progressData) {
        setDailyProgress(JSON.parse(progressData));
      }

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
    } catch (error) {
      console.error('Error loading tasks and goals data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // Task operations
  const addTask = useCallback(async (taskData: Omit<TodoTask, 'id' | 'createdAt' | 'isCompleted' | 'isArchived'>) => {
    const newTask: TodoTask = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      isCompleted: false,
      isArchived: false,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveData(STORAGE_KEYS.TASKS, updatedTasks);
  }, [tasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<TodoTask>) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    await saveData(STORAGE_KEYS.TASKS, updatedTasks);
  }, [tasks]);

  const completeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<TodoTask> = {
      isCompleted: true,
      completedAt: new Date(),
    };

    // Handle repetition
    if (task.repetition) {
      updates.repetition = {
        ...task.repetition,
        lastCompleted: new Date(),
      };
    }

    await updateTask(taskId, updates);
  }, [tasks, updateTask]);

  const archiveTask = useCallback(async (taskId: string) => {
    await updateTask(taskId, {
      isArchived: true,
      archivedAt: new Date(),
    });
  }, [updateTask]);

  const deleteTask = useCallback(async (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    await saveData(STORAGE_KEYS.TASKS, updatedTasks);
  }, [tasks]);

  // Goal operations
  const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'createdAt' | 'isActive'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: generateId(),
      createdAt: new Date(),
      isActive: true,
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    await saveData(STORAGE_KEYS.GOALS, updatedGoals);
  }, [goals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    setGoals(updatedGoals);
    await saveData(STORAGE_KEYS.GOALS, updatedGoals);
  }, [goals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    await saveData(STORAGE_KEYS.GOALS, updatedGoals);
  }, [goals]);

  // Goal completion operations
  const completeGoal = useCallback(async (goalId: string, date: string = new Date().toISOString().split('T')[0]) => {
    const newCompletion: GoalCompletion = {
      id: generateId(),
      goalId,
      completedAt: new Date(),
      date,
    };
    const updatedCompletions = [...goalCompletions, newCompletion];
    setGoalCompletions(updatedCompletions);
    await saveData(STORAGE_KEYS.GOAL_COMPLETIONS, updatedCompletions);
    await updateDailyProgress(date);
  }, [goalCompletions]);

  const uncompleteGoal = useCallback(async (goalId: string, date: string) => {
    const updatedCompletions = goalCompletions.filter(
      completion => !(completion.goalId === goalId && completion.date === date)
    );
    setGoalCompletions(updatedCompletions);
    await saveData(STORAGE_KEYS.GOAL_COMPLETIONS, updatedCompletions);
    await updateDailyProgress(date);
  }, [goalCompletions]);

  // Category operations
  const addCategory = useCallback(async (categoryData: Omit<GoalCategory, 'id' | 'isDefault'>) => {
    const newCategory: GoalCategory = {
      ...categoryData,
      id: generateId(),
      isDefault: false,
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await saveData(STORAGE_KEYS.CATEGORIES, updatedCategories);
  }, [categories]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    // Don't allow deletion of default categories
    const category = categories.find(c => c.id === categoryId);
    if (category?.isDefault) return;

    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    await saveData(STORAGE_KEYS.CATEGORIES, updatedCategories);
  }, [categories]);

  // Daily progress operations
  const updateDailyProgress = useCallback(async (date: string) => {
    const todayCompletions = goalCompletions.filter(completion => completion.date === date);
    const completedGoalIds = todayCompletions.map(completion => completion.goalId);
    
    const totalPoints = completedGoalIds.reduce((sum, goalId) => {
      const goal = goals.find(g => g.id === goalId);
      return sum + (goal?.points || 0);
    }, 0);

    const existingProgress = dailyProgress.find(p => p.date === date);
    const goalStreaks = calculateGoalStreaks(completedGoalIds, date);
    const streak = calculateDailyStreak(date);

    const newProgress: DailyProgress = {
      date,
      totalPoints,
      targetPoints: settings.dailyPointTarget,
      completedGoals: completedGoalIds,
      streak,
      goalStreaks,
    };

    const updatedProgress = existingProgress
      ? dailyProgress.map(p => p.date === date ? newProgress : p)
      : [...dailyProgress, newProgress];

    setDailyProgress(updatedProgress);
    await saveData(STORAGE_KEYS.DAILY_PROGRESS, updatedProgress);
  }, [goalCompletions, goals, dailyProgress, settings.dailyPointTarget]);

  const calculateGoalStreaks = useCallback((completedGoalIds: string[], date: string) => {
    const streaks: { [goalId: string]: number } = {};
    
    for (const goalId of completedGoalIds) {
      let streak = 1;
      let currentDate = new Date(date);
      
      while (true) {
        currentDate.setDate(currentDate.getDate() - 1);
        const previousDate = currentDate.toISOString().split('T')[0];
        const hasCompletion = goalCompletions.some(
          completion => completion.goalId === goalId && completion.date === previousDate
        );
        
        if (hasCompletion) {
          streak++;
        } else {
          break;
        }
      }
      
      streaks[goalId] = streak;
    }
    
    return streaks;
  }, [goalCompletions]);

  const calculateDailyStreak = useCallback((date: string) => {
    let streak = 0;
    let currentDate = new Date(date);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const progress = dailyProgress.find(p => p.date === dateStr);
      
      if (progress && progress.totalPoints >= progress.targetPoints) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [dailyProgress]);

  // Settings operations
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveData(STORAGE_KEYS.SETTINGS, newSettings);
  }, [settings]);

  // Computed values
  const activeTasks = tasks.filter(task => !task.isArchived && !task.isCompleted);
  const archivedTasks = tasks.filter(task => task.isArchived);
  const activeGoals = goals.filter(goal => goal.isActive);
  
  const todayProgress = dailyProgress.find(p => p.date === new Date().toISOString().split('T')[0]);
  const isGoalCompletedToday = (goalId: string) => {
    return todayProgress?.completedGoals.includes(goalId) || false;
  };

  return {
    // State
    tasks,
    goals,
    goalCompletions,
    categories,
    dailyProgress,
    settings,
    isLoading,
    
    // Computed values
    activeTasks,
    archivedTasks,
    activeGoals,
    todayProgress,
    isGoalCompletedToday,
    
    // Task operations
    addTask,
    updateTask,
    completeTask,
    archiveTask,
    deleteTask,
    
    // Goal operations
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    uncompleteGoal,
    
    // Category operations
    addCategory,
    deleteCategory,
    
    // Settings operations
    updateSettings,
    
    // Data operations
    loadData,
  };
} 
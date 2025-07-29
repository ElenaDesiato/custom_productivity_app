import { Project, Task, TimeEntry, TimerState } from '@/types/timeTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEYS = {
  PROJECTS: 'timeTracking_projects',
  TASKS: 'timeTracking_tasks',
  TIME_ENTRIES: 'timeTracking_timeEntries',
  TIMER_STATE: 'timeTracking_timerState',
};

export function useTimeTracking() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    elapsedSeconds: 0,
  });

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Timer effect - increment every second when running
  useEffect(() => {
    let interval: number | undefined;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning]);

  const loadData = async () => {
    try {
      const [projectsData, tasksData, timeEntriesData, timerStateData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE),
      ]);

      if (projectsData) {
        const parsedProjects = JSON.parse(projectsData);
        const projectsWithDates = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        setProjects(projectsWithDates);
      }
      
      if (tasksData) {
        const parsedTasks = JSON.parse(tasksData);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(tasksWithDates);
      }
      
      if (timeEntriesData) {
        const parsedTimeEntries = JSON.parse(timeEntriesData);
        const timeEntriesWithDates = parsedTimeEntries.map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          periods: entry.periods ? entry.periods.map((period: any) => ({
            startTime: new Date(period.startTime),
            endTime: period.endTime ? new Date(period.endTime) : undefined
          })) : undefined
        }));
        setTimeEntries(timeEntriesWithDates);
      }
      
      if (timerStateData) {
        const parsedTimerState = JSON.parse(timerStateData);
        const timerStateWithDates = {
          ...parsedTimerState,
          startTime: parsedTimerState.startTime ? new Date(parsedTimerState.startTime) : undefined
        };
        
        // If timer is running, calculate real elapsed time
        if (timerStateWithDates.isRunning && timerStateWithDates.startTime) {
          const now = new Date();
          const timeSinceStart = Math.floor((now.getTime() - timerStateWithDates.startTime.getTime()) / 1000);
          const realElapsedSeconds = (timerStateWithDates.elapsedSeconds || 0) + timeSinceStart;
          setTimerState({ ...timerStateWithDates, elapsedSeconds: realElapsedSeconds });
        } else {
          setTimerState(timerStateWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading time tracking data:', error);
    }
  };

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving time tracking data:', error);
    }
  };

  // Project management
  const addProject = useCallback(async (name: string, color: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date(),
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    await saveData(STORAGE_KEYS.PROJECTS, updatedProjects);
    return newProject;
  }, [projects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    setProjects(updatedProjects);
    await saveData(STORAGE_KEYS.PROJECTS, updatedProjects);
  }, [projects]);

  const deleteProject = useCallback(async (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    const updatedTasks = tasks.filter(t => t.projectId !== id);
    setProjects(updatedProjects);
    setTasks(updatedTasks);
    await Promise.all([
      saveData(STORAGE_KEYS.PROJECTS, updatedProjects),
      saveData(STORAGE_KEYS.TASKS, updatedTasks),
    ]);
  }, [projects, tasks]);

  // Task management
  const addTask = useCallback(async (name: string, projectId: string, color?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      projectId,
      color,
      createdAt: new Date(),
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveData(STORAGE_KEYS.TASKS, updatedTasks);
    return newTask;
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(updatedTasks);
    await saveData(STORAGE_KEYS.TASKS, updatedTasks);
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    const updatedTimeEntries = timeEntries.filter(te => te.taskId !== id);
    setTasks(updatedTasks);
    setTimeEntries(updatedTimeEntries);
    await Promise.all([
      saveData(STORAGE_KEYS.TASKS, updatedTasks),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [tasks, timeEntries]);

  // Timer management
  const startTimer = useCallback(async (taskId: string) => {
    const now = new Date();
    
    // Create a new time entry for the running timer
    const newTimeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      startTime: now,
      endTime: undefined,
      duration: undefined,
      isRunning: true,
      isPaused: false,
      periods: [{
        startTime: now,
        endTime: undefined
      }]
    };
    
    const updatedTimeEntries = [...timeEntries, newTimeEntry];
    setTimeEntries(updatedTimeEntries);
    
    // Set timer state
    const newTimerState: TimerState = {
      isRunning: true,
      currentTaskId: taskId,
      startTime: now,
      elapsedSeconds: 0,
      currentTimeEntryId: newTimeEntry.id,
    };
    
    setTimerState(newTimerState);
    
    // Save both timer state and time entries
    await Promise.all([
      saveData(STORAGE_KEYS.TIMER_STATE, newTimerState),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [timeEntries]);

  const startTimerWithCustomTime = useCallback(async (taskId: string, startTime: Date, elapsedSeconds: number) => {
    const now = new Date();
    
    // Create a new time entry for the running timer
    const newTimeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      startTime,
      endTime: undefined,
      duration: undefined,
      isRunning: true,
      isPaused: false,
      periods: [{
        startTime: now,
        endTime: undefined
      }]
    };
    
    const updatedTimeEntries = [...timeEntries, newTimeEntry];
    setTimeEntries(updatedTimeEntries);
    
    // Set timer state
    const newTimerState: TimerState = {
      isRunning: true,
      currentTaskId: taskId,
      startTime: now,
      elapsedSeconds,
      currentTimeEntryId: newTimeEntry.id,
    };
    
    setTimerState(newTimerState);
    
    // Save both timer state and time entries
    await Promise.all([
      saveData(STORAGE_KEYS.TIMER_STATE, newTimerState),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [timeEntries]);

  const pauseTimer = useCallback(async () => {
    if (!timerState.isRunning || !timerState.currentTimeEntryId) return;
    
    const now = new Date();
    
    // Update the time entry to mark it as paused
    const updatedTimeEntries = timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        // Add end time to the current period
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        if (updatedPeriods.length > 0) {
          updatedPeriods[updatedPeriods.length - 1] = {
            ...updatedPeriods[updatedPeriods.length - 1],
            endTime: now
          };
        }
        
        return {
          ...entry,
          isRunning: false,
          isPaused: true,
          periods: updatedPeriods
        };
      }
      return entry;
    });
    
    setTimeEntries(updatedTimeEntries);
    
    // Update timer state
    const pausedTimerState: TimerState = {
      ...timerState,
      isRunning: false,
      startTime: undefined,
    };
    
    setTimerState(pausedTimerState);
    
    // Save both timer state and time entries
    await Promise.all([
      saveData(STORAGE_KEYS.TIMER_STATE, pausedTimerState),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [timerState, timeEntries]);

  const resumeTimer = useCallback(async () => {
    if (timerState.isRunning || !timerState.currentTimeEntryId) return;
    
    const now = new Date();
    
    // Update the time entry to mark it as running again
    const updatedTimeEntries = timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        // Add a new period
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        updatedPeriods.push({
          startTime: now,
          endTime: undefined
        });
        
        return {
          ...entry,
          isRunning: true,
          isPaused: false,
          periods: updatedPeriods
        };
      }
      return entry;
    });
    
    setTimeEntries(updatedTimeEntries);
    
    // Update timer state
    const resumedTimerState: TimerState = {
      ...timerState,
      isRunning: true,
      startTime: now,
    };
    
    setTimerState(resumedTimerState);
    
    // Save both timer state and time entries
    await Promise.all([
      saveData(STORAGE_KEYS.TIMER_STATE, resumedTimerState),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [timerState, timeEntries]);

  const stopTimer = useCallback(async () => {
    if (!timerState.isRunning || !timerState.currentTimeEntryId || !timerState.startTime) return;

    const endTime = new Date();
    
    // Calculate total duration from all periods
    const timeEntry = timeEntries.find(entry => entry.id === timerState.currentTimeEntryId);
    if (!timeEntry) return;
    
    let totalDuration = 0;
    if (timeEntry.periods) {
      totalDuration = timeEntry.periods.reduce((total, period) => {
        if (period.endTime) {
          return total + Math.floor((period.endTime.getTime() - period.startTime.getTime()) / 1000);
        } else {
          // Current running period
          return total + Math.floor((endTime.getTime() - period.startTime.getTime()) / 1000);
        }
      }, 0);
    }
    
    // Update the time entry to mark it as completed
    const updatedTimeEntries = timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        // Add end time to the current period
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        if (updatedPeriods.length > 0) {
          updatedPeriods[updatedPeriods.length - 1] = {
            ...updatedPeriods[updatedPeriods.length - 1],
            endTime: endTime
          };
        }
        
        return {
          ...entry,
          endTime: endTime,
          duration: totalDuration,
          isRunning: false,
          isPaused: false,
          periods: updatedPeriods
        };
      }
      return entry;
    });
    
    setTimeEntries(updatedTimeEntries);
    
    // Reset timer state
    const stoppedTimerState: TimerState = {
      isRunning: false,
      elapsedSeconds: 0,
    };
    
    setTimerState(stoppedTimerState);
    
    // Save both timer state and time entries
    await Promise.all([
      saveData(STORAGE_KEYS.TIMER_STATE, stoppedTimerState),
      saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries),
    ]);
  }, [timerState, timeEntries]);

  // Manual time entry (for non-running entries)
  const addTimeEntry = useCallback(async (taskId: string, startTime: Date, endTime?: Date, duration?: number, isRunning: boolean = false) => {
    if (!endTime) {
      // For running entries, just add as is
      const newTimeEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId,
        startTime,
        endTime: undefined,
        duration: undefined,
      };
      const updatedTimeEntries = [...timeEntries, newTimeEntry];
      setTimeEntries(updatedTimeEntries);
      await saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries);
      return newTimeEntry;
    }

    // Check if the entry crosses midnight
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Get the calendar day (year, month, day) for proper comparison
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Compare the actual calendar days
    if (startDay.getTime() === endDay.getTime()) {
      // Same day entry, add as is
      const newTimeEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId,
        startTime,
        endTime,
        duration,
      };
      const updatedTimeEntries = [...timeEntries, newTimeEntry];
      setTimeEntries(updatedTimeEntries);
      await saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries);
      return newTimeEntry;
    } else {
      // Cross-midnight entry, split into multiple entries
      const entries: TimeEntry[] = [];
      let currentStart = new Date(startTime);
      let currentId = Date.now();

      while (currentStart < endDate) {
        // Find the end of the current day (11:59:59.999pm)
        const currentDayEnd = new Date(currentStart);
        currentDayEnd.setHours(23, 59, 59, 999);

        // If this is the last day, use the actual end time
        const entryEnd = currentDayEnd < endDate ? currentDayEnd : endDate;
        
        // Calculate duration for this segment
        const segmentDuration = Math.floor((entryEnd.getTime() - currentStart.getTime()) / 1000);

        const entry: TimeEntry = {
          id: currentId.toString(),
          taskId,
          startTime: new Date(currentStart),
          endTime: new Date(entryEnd),
          duration: segmentDuration,
        };

        entries.push(entry);
        currentId++;

        // Move to the start of the next day
        const nextDay = new Date(currentStart);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        currentStart = nextDay;
      }

      const updatedTimeEntries = [...timeEntries, ...entries];
      setTimeEntries(updatedTimeEntries);
      await saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries);
      return entries[0]; // Return the first entry for compatibility
    }
  }, [timeEntries]);

  // Delete time entry
  const deleteTimeEntry = useCallback(async (entryId: string) => {
    const updatedTimeEntries = timeEntries.filter(entry => entry.id !== entryId);
    setTimeEntries(updatedTimeEntries);
    await saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries);
  }, [timeEntries]);

  // Update time entry
  const updateTimeEntry = useCallback(async (entryId: string, updates: Partial<TimeEntry>) => {
    const updatedTimeEntries = timeEntries.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, ...updates };
      }
      return entry;
    });
    setTimeEntries(updatedTimeEntries);
    await saveData(STORAGE_KEYS.TIME_ENTRIES, updatedTimeEntries);
  }, [timeEntries]);

  // Get tasks by project
  const getTasksByProject = useCallback((projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks]);

  // Get project by ID
  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id);
  }, [projects]);

  // Get task by ID
  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  // Get current task details
  const getCurrentTask = useCallback(() => {
    if (!timerState.currentTaskId) return null;
    const task = getTaskById(timerState.currentTaskId);
    if (!task) return null;
    const project = getProjectById(task.projectId);
    return { task, project };
  }, [timerState.currentTaskId, getTaskById, getProjectById]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    projects,
    tasks,
    timeEntries,
    timerState,
    
    // Project management
    addProject,
    updateProject,
    deleteProject,
    
    // Task management
    addTask,
    updateTask,
    deleteTask,
    
    // Timer management
    startTimer,
    startTimerWithCustomTime,
    stopTimer,
    pauseTimer,
    resumeTimer,
    addTimeEntry,
    deleteTimeEntry,
    updateTimeEntry,
    
    // Utility functions
    getTasksByProject,
    getProjectById,
    getTaskById,
    getCurrentTask,
    formatTime,
    loadData,
  };
} 
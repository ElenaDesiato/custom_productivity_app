import { Project, Task, TimeEntry, TimerState } from '@/types/timeTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEYS = {
  PROJECTS: 'timeTracking_projects',
  TASKS: 'timeTracking_tasks',
  TIME_ENTRIES: 'timeTracking_timeEntries',
  TIMER_STATE: 'timeTracking_timerState',
};

interface TimeTrackingState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  timerState: TimerState;
  loading: boolean;
  loadData: () => Promise<void>;
  // Project actions
  addProject: (name: string, color: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Task actions
  addTask: (name: string, projectId: string, color?: string) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Timer actions
  startTimer: (taskId: string) => Promise<void>;
  startTimerWithCustomTime: (taskId: string, startTime: Date, elapsedSeconds: number) => Promise<void>;
  stopTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  // Time entry actions
  addTimeEntry: (taskId: string, startTime: Date, endTime?: Date, duration?: number, isRunning?: boolean) => Promise<TimeEntry>;
  deleteTimeEntry: (entryId: string) => Promise<void>;
  updateTimeEntry: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>;
  // Utility
  getTasksByProject: (projectId: string) => Task[];
  getProjectById: (id: string) => Project | undefined;
  getTaskById: (id: string) => Task | undefined;
  getCurrentTask: () => { task: Task; project: Project } | null;
  formatTime: (seconds: number) => string;
  resetData: () => Promise<void>;
}

const initialTimerState: TimerState = {
  isRunning: false,
  elapsedSeconds: 0,
};

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
  projects: [],
  tasks: [],
  timeEntries: [],
  timerState: initialTimerState,
  loading: true,

  loadData: async () => {
    set({ loading: true });
    try {
      const [projectsData, tasksData, timeEntriesData, timerStateData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE),
      ]);

      let projects: Project[] = [];
      let tasks: Task[] = [];
      let timeEntries: TimeEntry[] = [];
      let timerState: TimerState = initialTimerState;

      if (projectsData) {
        projects = JSON.parse(projectsData).map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }));
      }
      if (tasksData) {
        tasks = JSON.parse(tasksData).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
      }
      if (timeEntriesData) {
        timeEntries = JSON.parse(timeEntriesData).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          periods: entry.periods ? entry.periods.map((period: any) => ({
            startTime: new Date(period.startTime),
            endTime: period.endTime ? new Date(period.endTime) : undefined
          })) : undefined
        }));
      }
      if (timerStateData) {
        const parsed = JSON.parse(timerStateData);
        timerState = {
          ...parsed,
          startTime: parsed.startTime ? new Date(parsed.startTime) : undefined
        };
        // If timer is running, update elapsedSeconds
        if (timerState.isRunning && timerState.startTime) {
          const now = new Date();
          const timeSinceStart = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
          timerState.elapsedSeconds = (timerState.elapsedSeconds || 0) + timeSinceStart;
        }
      }
      set({ projects, tasks, timeEntries, timerState, loading: false });
    } catch (e) {
      set({ projects: [], tasks: [], timeEntries: [], timerState: initialTimerState, loading: false });
    }
  },

  // Project actions
  addProject: async (name, color) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date(),
    };
    const updatedProjects = [...get().projects, newProject];
    set({ projects: updatedProjects });
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    return newProject;
  },
  updateProject: async (id, updates) => {
    const updatedProjects = get().projects.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ projects: updatedProjects });
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
  },
  deleteProject: async (id) => {
    const updatedProjects = get().projects.filter(p => p.id !== id);
    const updatedTasks = get().tasks.filter(t => t.projectId !== id);
    set({ projects: updatedProjects, tasks: updatedTasks });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects)),
      AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks)),
    ]);
  },

  // Task actions
  addTask: async (name, projectId, color) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      projectId,
      color,
      createdAt: new Date(),
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    return newTask;
  },
  updateTask: async (id, updates) => {
    const updatedTasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ tasks: updatedTasks });
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  },
  deleteTask: async (id) => {
    const updatedTasks = get().tasks.filter(t => t.id !== id);
    const updatedTimeEntries = get().timeEntries.filter(te => te.taskId !== id);
    set({ tasks: updatedTasks, timeEntries: updatedTimeEntries });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },

  // Timer actions
  startTimer: async (taskId) => {
    const now = new Date();
    const newTimeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      startTime: now,
      endTime: undefined,
      duration: undefined,
      isRunning: true,
      isPaused: false,
      periods: [{ startTime: now, endTime: undefined }],
    };
    const updatedTimeEntries = [...get().timeEntries, newTimeEntry];
    set({ timeEntries: updatedTimeEntries });
    const newTimerState: TimerState = {
      isRunning: true,
      currentTaskId: taskId,
      startTime: now,
      elapsedSeconds: 0,
      currentTimeEntryId: newTimeEntry.id,
    };
    set({ timerState: newTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(newTimerState)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },
  startTimerWithCustomTime: async (taskId, startTime, elapsedSeconds) => {
    const now = new Date();
    const newTimeEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      startTime,
      endTime: undefined,
      duration: undefined,
      isRunning: true,
      isPaused: false,
      periods: [{ startTime: now, endTime: undefined }],
    };
    const updatedTimeEntries = [...get().timeEntries, newTimeEntry];
    set({ timeEntries: updatedTimeEntries });
    const newTimerState: TimerState = {
      isRunning: true,
      currentTaskId: taskId,
      startTime: now,
      elapsedSeconds,
      currentTimeEntryId: newTimeEntry.id,
    };
    set({ timerState: newTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(newTimerState)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },
  pauseTimer: async () => {
    const timerState = get().timerState;
    if (!timerState.isRunning || !timerState.currentTimeEntryId) return;
    const now = new Date();
    const updatedTimeEntries = get().timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        if (updatedPeriods.length > 0) {
          updatedPeriods[updatedPeriods.length - 1] = {
            ...updatedPeriods[updatedPeriods.length - 1],
            endTime: now
          };
        }
        return { ...entry, isRunning: false, isPaused: true, periods: updatedPeriods };
      }
      return entry;
    });
    set({ timeEntries: updatedTimeEntries });
    const pausedTimerState: TimerState = { ...timerState, isRunning: false, startTime: undefined };
    set({ timerState: pausedTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(pausedTimerState)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },
  resumeTimer: async () => {
    const timerState = get().timerState;
    if (timerState.isRunning || !timerState.currentTimeEntryId) return;
    const now = new Date();
    const updatedTimeEntries = get().timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        updatedPeriods.push({ startTime: now, endTime: undefined });
        return { ...entry, isRunning: true, isPaused: false, periods: updatedPeriods };
      }
      return entry;
    });
    set({ timeEntries: updatedTimeEntries });
    const resumedTimerState: TimerState = { ...timerState, isRunning: true, startTime: now };
    set({ timerState: resumedTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(resumedTimerState)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },
  stopTimer: async () => {
    const timerState = get().timerState;
    if (!timerState.isRunning || !timerState.currentTimeEntryId || !timerState.startTime) return;
    const endTime = new Date();
    const timeEntry = get().timeEntries.find(entry => entry.id === timerState.currentTimeEntryId);
    if (!timeEntry) return;
    let totalDuration = 0;
    if (timeEntry.periods) {
      totalDuration = timeEntry.periods.reduce((total, period) => {
        if (period.endTime) {
          return total + Math.floor((period.endTime.getTime() - period.startTime.getTime()) / 1000);
        } else {
          return total + Math.floor((endTime.getTime() - period.startTime.getTime()) / 1000);
        }
      }, 0);
    }
    const updatedTimeEntries = get().timeEntries.map(entry => {
      if (entry.id === timerState.currentTimeEntryId) {
        const updatedPeriods = entry.periods ? [...entry.periods] : [];
        if (updatedPeriods.length > 0) {
          updatedPeriods[updatedPeriods.length - 1] = {
            ...updatedPeriods[updatedPeriods.length - 1],
            endTime: endTime
          };
        }
        return { ...entry, endTime, duration: totalDuration, isRunning: false, isPaused: false, periods: updatedPeriods };
      }
      return entry;
    });
    set({ timeEntries: updatedTimeEntries });
    const stoppedTimerState: TimerState = { isRunning: false, elapsedSeconds: 0 };
    set({ timerState: stoppedTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(stoppedTimerState)),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries)),
    ]);
  },

  // Time entry actions
  addTimeEntry: async (taskId, startTime, endTime, duration, isRunning = false) => {
    if (!endTime) {
      const newTimeEntry: TimeEntry = { id: Date.now().toString(), taskId, startTime, endTime: undefined, duration: undefined };
      const updatedTimeEntries = [...get().timeEntries, newTimeEntry];
      set({ timeEntries: updatedTimeEntries });
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries));
      return newTimeEntry;
    }
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (startDay.getTime() === endDay.getTime()) {
      const newTimeEntry: TimeEntry = { id: Date.now().toString(), taskId, startTime, endTime, duration };
      const updatedTimeEntries = [...get().timeEntries, newTimeEntry];
      set({ timeEntries: updatedTimeEntries });
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries));
      return newTimeEntry;
    } else {
      const entries: TimeEntry[] = [];
      let currentStart = new Date(startTime);
      let currentId = Date.now();
      while (currentStart < endDate) {
        const currentDayEnd = new Date(currentStart);
        currentDayEnd.setHours(23, 59, 59, 999);
        const entryEnd = currentDayEnd < endDate ? currentDayEnd : endDate;
        const segmentDuration = Math.floor((entryEnd.getTime() - currentStart.getTime()) / 1000);
        const entry: TimeEntry = { id: currentId.toString(), taskId, startTime: new Date(currentStart), endTime: new Date(entryEnd), duration: segmentDuration };
        entries.push(entry);
        currentId++;
        const nextDay = new Date(currentStart);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        currentStart = nextDay;
      }
      const updatedTimeEntries = [...get().timeEntries, ...entries];
      set({ timeEntries: updatedTimeEntries });
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries));
      return entries[0];
    }
  },
  deleteTimeEntry: async (entryId) => {
    const updatedTimeEntries = get().timeEntries.filter(entry => entry.id !== entryId);
    set({ timeEntries: updatedTimeEntries });
    await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries));
  },
  updateTimeEntry: async (entryId, updates) => {
    const updatedTimeEntries = get().timeEntries.map(entry => entry.id === entryId ? { ...entry, ...updates } : entry);
    set({ timeEntries: updatedTimeEntries });
    await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(updatedTimeEntries));
  },

  // Utility
  getTasksByProject: (projectId) => get().tasks.filter(task => task.projectId === projectId),
  getProjectById: (id) => get().projects.find(project => project.id === id),
  getTaskById: (id) => get().tasks.find(task => task.id === id),
  getCurrentTask: () => {
    const timerState = get().timerState;
    if (!timerState.currentTaskId) return null;
    const task = get().tasks.find(t => t.id === timerState.currentTaskId);
    if (!task) return null;
    const project = get().projects.find(p => p.id === task.projectId);
    if (!project) return null;
    return { task, project };
  },
  formatTime: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  resetData: async () => {
    const clearedTimerState = { isRunning: false, elapsedSeconds: 0 };
    set({ projects: [], tasks: [], timeEntries: [], timerState: clearedTimerState });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(clearedTimerState)),
    ]);
  },
}));

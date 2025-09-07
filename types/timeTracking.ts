export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  color?: string; // Optional task color, defaults to project color
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  notes?: string;
  // For running entries
  isRunning?: boolean;
}

export interface TimeEntryWithDetails extends TimeEntry {
  task: Task;
  project: Project;
}

export interface WeeklyTimesheet {
  weekStart: Date;
  weekEnd: Date;
  days: {
    [date: string]: TimeEntryWithDetails[];
  };
  totalHours: number;
}

export interface TimeReport {
  period: 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';
  startDate: Date;
  endDate: Date;
  totalHours: number;
  byTask: {
    taskId: string;
    taskName: string;
    projectName: string;
    hours: number;
    percentage: number;
  }[];
  byProject: {
    projectId: string;
    projectName: string;
    hours: number;
    percentage: number;
  }[];
}

export interface TimerState {
  isRunning: boolean;
  currentTaskId?: string;
  startTime?: Date;
  elapsedSeconds: number;
  // Track the running time entry ID
  currentTimeEntryId?: string;
} 
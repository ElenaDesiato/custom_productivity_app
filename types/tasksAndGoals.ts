export interface TodoTask {
  id: string;
  title: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  repetition?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number; // for custom repetition (e.g., every 3 days)
    lastCompleted?: Date;
  };
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  points: number;
  isActive: boolean;
  createdAt: Date;
  customCategory?: boolean; // true if user created this category
}

export interface GoalCompletion {
  id: string;
  goalId: string;
  completedAt: Date;
  date: string; // YYYY-MM-DD format for easy querying
}

export interface GoalCategory {
  id: string;
  name: string;
  color: string;
  isDefault: boolean; // true for predefined categories
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  totalPoints: number;
  targetPoints: number;
  completedGoals: string[]; // goal IDs
  streak: number; // current streak for meeting daily target
  goalStreaks: { [goalId: string]: number }; // individual goal streaks
}

export interface UserSettings {
  dailyPointTarget: number;
  defaultGoalPoints: number;
}

// Predefined goal categories
export const DEFAULT_GOAL_CATEGORIES: GoalCategory[] = [
  { id: 'movement', name: 'Movement', color: '#4CAF50', isDefault: true },
  { id: 'self-kindness', name: 'Self-Kindness', color: '#FF9800', isDefault: true },
  { id: 'nutrition', name: 'Nutrition', color: '#2196F3', isDefault: true },
  { id: 'hygiene', name: 'Hygiene', color: '#9C27B0', isDefault: true },
  { id: 'productivity', name: 'Productivity', color: '#607D8B', isDefault: true },
  { id: 'human-connection', name: 'Human Connection', color: '#E91E63', isDefault: true },
  { id: 'personal', name: 'Personal', color: '#795548', isDefault: true },
];

export interface TasksAndGoalsState {
  tasks: TodoTask[];
  goals: Goal[];
  goalCompletions: GoalCompletion[];
  categories: GoalCategory[];
  dailyProgress: DailyProgress[];
  settings: UserSettings;
} 
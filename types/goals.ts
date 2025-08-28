// Types for the Goals feature



export interface SelfCareArea {
  id: string;
  name: string;
  icon: string; // icon name or uri
  color: string; // hex color for the area
}

export interface Goal {
  id: string;
  description: string;
  areaId: string;
  repetitionDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  icon: string; // icon name or uri
  color?: string;
  points: number;
  completedDates: string[]; // ISO date strings
}

export interface UserSettings {
  dailyPointGoal: number;
  currentStreak: number;
  highestStreak: number;
  lastCompletionDate: string | null; // ISO date string
}

export interface WeeklyAreaGoal {
  id: string;
  areaId: string;
  weekStart: string; // ISO date string (Monday)
  weekEnd: string;   // ISO date string (Sunday)
  targetPoints: number;
  pointsAchieved: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  areaStats: {
    areaId: string;
    points: number;
    goalsCompleted: number;
  }[];
}

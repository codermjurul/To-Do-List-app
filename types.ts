
export type ViewType = 'tasks' | 'progress' | 'streaks' | 'journal' | 'settings';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  isCompleted: boolean;
  xpReward: number;
  createdAt: number;
}

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  userId?: string;
  listId?: string;
  title: string;
  completed: boolean;
  priority: TaskPriority; 
  xpWorth: number; 
  category?: string;
  timestamp: number;
  completedAt?: number;
  duration?: number; // duration in minutes
}

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskTitle: string;
  totalSeconds: number;
  remainingSeconds: number;
}

export interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  accumulatedSeconds: number;
  elapsedSeconds: number;
  sessionId: string | null;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  gamerTag: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  zoom: number;
  stats?: {
    totalHours: number;
    totalTasksCompleted: number;
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  images: string[];
  mood: 'focus' | 'success' | 'failure' | 'neutral' | 'idea';
  createdAt: number;
}

export type AppTheme = 'neon-lime' | 'crimson-red' | 'cyan-blue' | 'royal-purple' | 'sunset-orange';

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  timezone: string;
  theme: AppTheme;
  streakStartTimestamp?: number;
}

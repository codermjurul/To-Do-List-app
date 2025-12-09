

export type ViewType = 'tasks' | 'progress' | 'streaks' | 'journal' | 'settings';

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  listId?: string;
  title: string;
  completed: boolean;
  priority: TaskPriority; // Replaces simple boolean isImportant
  xpWorth: number; // Calculated on creation
  category?: string;
  timestamp: number;
  completedAt?: number;
  duration?: number; // duration in minutes
}

export interface ListGroup {
  id: string;
  name: string;
  count: number;
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
  startTime: number | null; // Timestamp
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
  avatarUrl: string; // Base64 or URL
  gamerTag: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  zoom: number; // For image cropping/adjustment
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
  images: string[]; // Base64 strings or URLs
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
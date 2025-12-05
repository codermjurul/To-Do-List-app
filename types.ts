export type ViewType = 'tasks' | 'streaks' | 'journal' | 'settings';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isImportant: boolean;
  category?: string;
  timestamp: number;
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

export interface UserProfile {
  name: string;
  avatarUrl: string; // Base64 or URL
  gamerTag: string;
  level: number;
  zoom: number; // For image cropping/adjustment
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
}
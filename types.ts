export type ViewType = 'tasks' | 'streaks' | 'journal';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isImportant: boolean;
  category?: string;
  timestamp: number;
}

export interface ListGroup {
  id: string;
  name: string;
  count: number;
}
import { TaskPriority } from "../types";

export const calculateTaskXP = (durationMinutes: number = 15, priority: TaskPriority): number => {
  // Base calculation: 2 XP per minute of estimated work
  const baseXP = durationMinutes * 2;

  let multiplier = 1;

  switch (priority) {
    case 'Low':
      multiplier = 0.5;
      break;
    case 'Medium':
      multiplier = 1.0;
      break;
    case 'High':
      multiplier = 1.5;
      break;
    case 'Critical':
      multiplier = 2.0;
      break;
  }

  // Minimum 10 XP for any task
  return Math.max(10, Math.round(baseXP * multiplier));
};

export const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'Medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'Low': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    default: return 'text-gray-400 bg-gray-500/10';
  }
};
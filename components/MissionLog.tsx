

import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, Trophy, Clock, Zap, AlertTriangle, AlertCircle, ChevronLeft } from 'lucide-react';
import { Task, TimerState, TaskPriority, UserProfile } from '../types';
import { calculateTaskXP, getPriorityColor } from '../lib/xpSystem';

interface MissionLogProps {
  tasks: Task[];
  timerState: TimerState;
  onAddTask: (title: string, durationMinutes: number, priority: TaskPriority) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  listName: string;
  onBack?: () => void;
  userProfile: UserProfile;
}

const DURATIONS = [5, 10, 20, 30, 40, 60, 120, 180];
const PRIORITIES: { id: TaskPriority, label: string }[] = [
  { id: 'Low', label: 'Low' },
  { id: 'Medium', label: 'Medium' },
  { id: 'High', label: 'High' },
  { id: 'Critical', label: 'Critical' }
];

export const MissionLog: React.FC<MissionLogProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleComplete, 
  onDeleteTask,
  listName,
  onBack,
  userProfile
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(20); // Default 20 mins
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('Medium');

  // Pre-load the sound
  const successAudio = useMemo(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.volume = 0.4;
    return audio;
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  // XP Calculation based on User Profile (Global)
  const xpPercentage = userProfile.nextLevelXP > 0 
    ? Math.min(100, Math.round((userProfile.currentXP / userProfile.nextLevelXP) * 100)) 
    : 0;

  // Calculate potential XP for new task preview
  const previewXP = useMemo(() => {
    return calculateTaskXP(selectedDuration, selectedPriority);
  }, [selectedDuration, selectedPriority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onAddTask(
      newTaskTitle, 
      selectedDuration, 
      selectedPriority
    );
    
    // Reset defaults
    setNewTaskTitle('');
    setSelectedDuration(20);
    setSelectedPriority('Medium');
  };

  const handleTaskCheck = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      successAudio.currentTime = 0;
      successAudio.play().catch(e => console.warn("Audio interaction needed", e));
    }
    onToggleComplete(id);
  };

  const formatDurationChip = (mins: number) => {
    if (mins >= 60) return `${mins/60}h`;
    return `${mins}m`;
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden animate-fade-in-up">
      {/* Header Area */}
      <div className="px-8 pt-8 pb-6 flex flex-col gap-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{listName}</h1>
              <p className="text-gray-400 text-sm mt-1">Select a mission to execute.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             {/* Global XP Progress Bar */}
             <div className="flex flex-col gap-2 w-64">
                <div className="flex justify-between items-center text-xs font-medium">
                   <div className="flex items-center gap-1.5 text-brand-primary">
                     <Trophy size={14} />
                     <span>Current Level {userProfile.level}</span>
                   </div>
                   <span className="text-white">{userProfile.currentXP} <span className="text-gray-500">/ {userProfile.nextLevelXP} XP</span></span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                   <div 
                      className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${xpPercentage}%` }}
                   ></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Task List */}
      <div className="flex-1 px-8 pb-8 overflow-hidden z-10">
        <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden border-white/5">
          
          {/* List Header */}
          <div className="flex items-center px-6 py-4 border-b border-white/5 bg-white/[0.02] text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex-1">Mission Objective</div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {activeTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={handleTaskCheck} 
                onDeleteTask={onDeleteTask}
              />
            ))}

            {activeTasks.length === 0 && tasks.length > 0 && (
               <div className="py-8 text-center text-gray-500 text-sm italic opacity-50">
                  No active missions.
               </div>
            )}
            
            {completedTasks.length > 0 && (
              <div className="pt-6 pb-2 px-4">
                 <div className="flex items-center gap-3 text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Completed</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{completedTasks.length} Done</span>
                 </div>
              </div>
            )}

            {completedTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={handleTaskCheck} 
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>

          {/* Add Task Input Area */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" />
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new mission..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-primary/50 focus:bg-black/40 transition-all"
                />
              </div>

              {/* Controls Container */}
              {newTaskTitle.length > 0 && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  
                  <div className="flex items-center gap-4 overflow-x-auto pb-1 custom-scrollbar">
                     
                     {/* Priority Selector */}
                     <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                           <AlertTriangle size={12} />
                           <span>Priority:</span>
                        </div>
                        {PRIORITIES.map(p => (
                           <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPriority(p.id)}
                              className={`
                                 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide border transition-all shrink-0
                                 ${selectedPriority === p.id
                                    ? getPriorityColor(p.id) + ' bg-opacity-20 border-opacity-80 scale-105'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                                 }
                              `}
                           >
                              {p.label}
                           </button>
                        ))}
                     </div>

                     {/* Duration Selector */}
                     <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                        <Clock size={12} />
                        <span>Duration:</span>
                      </div>
                      {DURATIONS.map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setSelectedDuration(mins)}
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0
                            ${selectedDuration === mins 
                              ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                            }
                          `}
                        >
                          {formatDurationChip(mins)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* XP Preview Badge */}
                  <div className="flex justify-end mt-1">
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-medium text-gray-300">Estimated Reward:</span>
                        <span className="text-xs font-bold text-white">{previewXP} XP</span>
                     </div>
                  </div>

                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

const TaskRow: React.FC<{ 
  task: Task; 
  onToggleComplete: (id: string) => void; 
  onDeleteTask: (id: string) => void;
}> = ({ task, onToggleComplete, onDeleteTask }) => {

  return (
    <div 
      className={`
        group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border relative
        ${task.completed 
          ? 'opacity-50 hover:opacity-80 bg-black/20 border-transparent' 
          : task.priority === 'Critical'
                ? 'bg-red-900/10 border-red-500/20 shadow-[inset_0_0_15px_rgba(220,38,38,0.05)]'
                : 'hover:bg-white/5 border-transparent hover:border-white/5'
        }
      `}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {/* Checkbox */}
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={`
            shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
            ${task.completed 
              ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]' 
              : task.priority === 'Critical'
                 ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                 : 'border-gray-600 hover:border-gray-400 group-hover:bg-white/5'
            }
          `}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task Details */}
        <div className="flex flex-col justify-center overflow-hidden w-full">
          <div className="flex items-center gap-2 w-full">
            {task.priority === 'Critical' && !task.completed && (
                <AlertCircle size={14} className="text-red-500 animate-pulse shrink-0" />
            )}
            <span className={`text-sm font-medium transition-colors truncate mr-2 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
              {task.title}
            </span>
            
            {/* XP Badge */}
            <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center gap-0.5 font-bold shrink-0">
               <Zap size={8} fill="currentColor" /> {task.xpWorth || 10}
            </span>

            {/* Priority Badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide font-bold shrink-0 ${getPriorityColor(task.priority || 'Medium')}`}>
              {task.priority || 'Medium'}
            </span>
          </div>
          {!task.completed && (
             <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
               {new Date(task.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
          )}
        </div>
      </div>

      {/* Delete Action - Appears on hover */}
      <div className="flex items-center">
         <button 
          onClick={() => onDeleteTask(task.id)}
          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white/5 rounded-lg"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
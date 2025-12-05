import React, { useState, useMemo } from 'react';
import { Plus, Check, Star, Trash2, Trophy, Clock } from 'lucide-react';
import { Task } from '../types';

interface MissionLogProps {
  tasks: Task[];
  onAddTask: (title: string, durationMinutes?: number) => void;
  onToggleComplete: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const DURATIONS = [5, 10, 20, 30, 40, 60, 120, 180];

export const MissionLog: React.FC<MissionLogProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleComplete, 
  onToggleImportant,
  onDeleteTask
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  // Pre-load the sound
  const successAudio = useMemo(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.volume = 0.4;
    return audio;
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  const xpPoints = completedTasks.length * 10;
  const totalPossibleXP = tasks.length * 10;
  const progressPercentage = totalPossibleXP > 0 ? (xpPoints / totalPossibleXP) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onAddTask(newTaskTitle, selectedDuration || undefined);
    
    // Reset
    setNewTaskTitle('');
    setSelectedDuration(null);
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
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header Area */}
      <div className="px-8 pt-8 pb-6 flex flex-col gap-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Active Missions</h1>
            <p className="text-gray-400 text-sm mt-1">Select a mission, set a timer, and execute.</p>
          </div>
          
          <div className="flex items-center gap-6">
             {/* XP Progress Bar */}
             <div className="flex flex-col gap-2 w-64">
                <div className="flex justify-between items-center text-xs font-medium">
                   <div className="flex items-center gap-1.5 text-brand-primary">
                     <Trophy size={14} />
                     <span>XP Gained</span>
                   </div>
                   <span className="text-white">{xpPoints} <span className="text-gray-500">pts</span></span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                   <div className="absolute top-0 left-0 h-full bg-brand-primary/50 blur-[4px]" style={{ width: `${progressPercentage}%` }}></div>
                   <div 
                     className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full transition-all duration-500 ease-out"
                     style={{ width: `${progressPercentage}%` }}
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
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02] text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-8">Task Name</div>
            <div className="col-span-2 text-right">Priority</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {activeTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={handleTaskCheck} 
                onToggleImportant={onToggleImportant}
                onDeleteTask={onDeleteTask}
              />
            ))}

            {activeTasks.length === 0 && tasks.length > 0 && (
               <div className="py-8 text-center text-gray-500 text-sm italic opacity-50">
                  No active tasks.
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
                onToggleImportant={onToggleImportant}
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

              {/* Time Selector Chips */}
              {newTaskTitle.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2 shrink-0">
                    <Clock size={12} />
                    <span>Set Timer:</span>
                  </div>
                  {DURATIONS.map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSelectedDuration(selectedDuration === mins ? null : mins)}
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
  onToggleImportant: (id: string) => void;
  onDeleteTask: (id: string) => void;
}> = ({ task, onToggleComplete, onToggleImportant, onDeleteTask }) => {
  return (
    <div 
      className={`
        group grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl transition-all duration-200 border border-transparent 
        ${task.completed ? 'opacity-50 hover:opacity-80 bg-black/20' : 'hover:bg-white/5 hover:border-white/5'}
      `}
    >
      <div className="col-span-1 flex justify-center">
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={`
            w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
            ${task.completed 
              ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]' 
              : 'border-gray-600 hover:border-gray-400 group-hover:bg-white/5'
            }
          `}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
      </div>

      <div className="col-span-8 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium transition-colors ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
            {task.title}
          </span>
          {task.duration && !task.completed && (
             <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center gap-1">
               <Clock size={8} /> {task.duration}m
             </span>
          )}
        </div>
        {!task.completed && (
           <span className="text-[10px] text-gray-500 mt-0.5">
             {new Date(task.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </span>
        )}
      </div>

      <div className="col-span-2 flex justify-end">
         <button 
            onClick={() => onToggleImportant(task.id)}
            className={`transition-all duration-300 transform active:scale-90 ${task.isImportant ? 'text-brand-primary' : 'text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100'}`}
         >
           <Star size={16} fill={task.isImportant ? "currentColor" : "none"} />
         </button>
      </div>

      <div className="col-span-1 flex justify-end">
        <button 
          onClick={() => onDeleteTask(task.id)}
          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-white/5 rounded-lg"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
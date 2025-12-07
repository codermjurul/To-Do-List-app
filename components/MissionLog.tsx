
import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, Trophy, Clock, Music, Tag } from 'lucide-react';
import { Task, CustomPlaylist, TimerState } from '../types';

interface MissionLogProps {
  tasks: Task[];
  timerState: TimerState;
  onAddTask: (title: string, durationMinutes?: number, spotifyUri?: string, category?: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onDeleteTask: (id: string) => void;
  customPlaylists?: CustomPlaylist[];
}

const DURATIONS = [5, 10, 20, 30, 40, 60, 120, 180];
const CATEGORIES = ['Marketing', 'Sales', 'Product', 'Delivery', 'Discipline'];

// Pre-defined high-quality playlists for productivity
const DEFAULT_PLAYLISTS = [
  { name: 'Deep Focus', uri: 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'Techno Bunker', uri: 'spotify:playlist:37i9dQZF1DX6J5NfMJS675', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'Brain Food', uri: 'spotify:playlist:37i9dQZF1DWXLeA8Omikj7', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { name: 'Lofi Beats', uri: 'spotify:playlist:37i9dQZF1DWWQRwui0ExPn', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'Hans Zimmer', uri: 'spotify:playlist:37i9dQZF1DWVFJtzvDHN4L', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
];

// Circular Progress Component
const CircularProgress = ({ percentage, isCompleted, isActive }: { percentage: number, isCompleted: boolean, isActive: boolean }) => {
  const radius = 14; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow Container - Pulses when active */}
      <div className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${
        isCompleted ? 'bg-brand-primary/20' : 
        isActive ? 'bg-brand-primary/30 animate-pulse' : 
        percentage > 0 ? 'bg-brand-primary/10' : 'bg-transparent'
      }`}></div>
      
      <svg width="36" height="36" className={`transform -rotate-90 relative z-10 transition-transform duration-500 ${isActive ? 'scale-105' : ''}`}>
        {/* Track */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-white/5"
        />
        {/* Progress */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // duration-1000 ease-linear interpolates the 1-second updates into a continuous motion
          className={`transition-all duration-1000 ease-linear ${isCompleted ? 'text-brand-primary' : 'text-brand-primary'}`}
        />
      </svg>
      
      {/* Inner Indicator */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
         {isCompleted ? (
             <div className="w-2 h-2 bg-brand-primary rounded-full shadow-[0_0_5px_currentColor]"></div>
         ) : isActive ? (
             <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></div>
         ) : percentage > 0 ? (
             <div className="text-[8px] font-bold text-brand-primary tabular-nums">{Math.round(percentage)}%</div>
         ) : (
             <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
         )}
      </div>
    </div>
  );
};

export const MissionLog: React.FC<MissionLogProps> = ({ 
  tasks, 
  timerState,
  onAddTask, 
  onToggleComplete, 
  onDeleteTask,
  customPlaylists = []
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedPlaylistUri, setSelectedPlaylistUri] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Merge default and custom playlists
  const allPlaylists = useMemo(() => {
    const customFormatted = customPlaylists.map(cp => ({
      name: cp.name,
      uri: cp.uri,
      color: 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'
    }));
    return [...DEFAULT_PLAYLISTS, ...customFormatted];
  }, [customPlaylists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // Smart Frictionless Logic: If user picked music but no time, default to 25m focus block
    const finalDuration = selectedDuration || (selectedPlaylistUri ? 25 : undefined);

    onAddTask(
      newTaskTitle, 
      finalDuration, 
      selectedPlaylistUri || undefined, 
      selectedCategory || undefined
    );
    
    // Reset
    setNewTaskTitle('');
    setSelectedDuration(null);
    setSelectedPlaylistUri(null);
    setSelectedCategory(null);
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
            <div className="col-span-10">Task Name</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {activeTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                timerState={timerState}
                onToggleComplete={handleTaskCheck} 
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
                timerState={timerState}
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
                    
                    {/* Category Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                        <Tag size={12} />
                        <span>Category:</span>
                      </div>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                          className={`
                            px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-all shrink-0
                            ${selectedCategory === cat
                              ? 'bg-white text-black border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                            }
                          `}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 overflow-x-auto pb-1 custom-scrollbar">
                     {/* Timer Selector */}
                     <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                        <Clock size={12} />
                        <span>Timer:</span>
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

                    {/* Playlist Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                        <Music size={12} />
                        <span>OST:</span>
                      </div>
                      {allPlaylists.map(playlist => (
                        <button
                          key={playlist.uri}
                          type="button"
                          onClick={() => setSelectedPlaylistUri(selectedPlaylistUri === playlist.uri ? null : playlist.uri)}
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 whitespace-nowrap
                            ${selectedPlaylistUri === playlist.uri
                              ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                              : `bg-white/5 border-white/10 hover:bg-white/10 ${playlist.color.split(' ')[1]}`
                            }
                          `}
                        >
                          {playlist.name}
                        </button>
                      ))}
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
  timerState: TimerState;
  onToggleComplete: (id: string) => void; 
  onDeleteTask: (id: string) => void;
}> = ({ task, timerState, onToggleComplete, onDeleteTask }) => {
  const isRunning = timerState.taskId === task.id;
  
  let progress = 0;
  if (task.completed) {
    progress = 100;
  } else if (isRunning && timerState.totalSeconds > 0) {
    progress = ((timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds) * 100;
  }

  return (
    <div 
      className={`
        group grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl transition-all duration-200 border border-transparent 
        ${task.completed ? 'opacity-50 hover:opacity-80 bg-black/20' : 'hover:bg-white/5 hover:border-white/5'}
      `}
    >
      <div className="col-span-10 flex items-center gap-4">
        {/* Checkbox */}
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={`
            shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
            ${task.completed 
              ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]' 
              : 'border-gray-600 hover:border-gray-400 group-hover:bg-white/5'
            }
          `}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task Details */}
        <div className="flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors truncate ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
              {task.title}
            </span>
            {task.category && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-gray-400 border border-white/5 uppercase tracking-wide">
                {task.category}
              </span>
            )}
            {task.duration && !task.completed && (
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center gap-1 shrink-0">
                 <Clock size={8} /> {task.duration}m
               </span>
            )}
            {task.spotifyUri && !task.completed && (
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 shrink-0">
                 <Music size={8} /> OST
               </span>
            )}
          </div>
          {!task.completed && (
             <span className="text-[10px] text-gray-500 mt-0.5">
               {new Date(task.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
          )}
        </div>
      </div>

      {/* Status Column: Progress + Delete */}
      <div className="col-span-2 flex justify-end items-center gap-3">
         <CircularProgress percentage={progress} isCompleted={task.completed} isActive={isRunning} />
         
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

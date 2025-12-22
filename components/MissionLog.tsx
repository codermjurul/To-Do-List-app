
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, Trash2, Trophy, Clock, Zap, AlertCircle, ChevronLeft, Plus, ArrowUp, Flag, ArrowRight, X } from 'lucide-react';
import { Task, TimerState, TaskPriority, UserProfile } from '../types';
import { calculateTaskXP, getPriorityColor } from '../lib/xpSystem';

interface MissionLogProps {
  tasks: Task[];
  timerState: TimerState;
  onAddTask: (title: string, durationMinutes: number, priority: TaskPriority) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  listId: string;
  listName: string;
  onBack?: () => void;
  userProfile: UserProfile;
}

const DURATIONS = [5, 10, 20, 30, 40, 60, 120, 180];
const PRIORITIES: { id: TaskPriority, label: string, color: string }[] = [
  { id: 'Low', label: 'Low', color: 'text-sky-300' },
  { id: 'Medium', label: 'Medium', color: 'text-blue-400' },
  { id: 'High', label: 'High', color: 'text-orange-400' },
  { id: 'Critical', label: 'Critical', color: 'text-red-500' }
];

export const MissionLog: React.FC<MissionLogProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleComplete, 
  onDeleteTask,
  listId,
  listName,
  onBack,
  userProfile
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(20);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('Medium');
  
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  
  const priorityRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setShowDurationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const successAudio = useMemo(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.volume = 0.4;
    return audio;
  }, []);

  // Filter tasks: For the 'daily' list, we show everything from today + uncompleted from yesterday
  const filteredTasks = useMemo(() => {
    if (listId !== 'daily' && !listId.includes('daily')) return tasks;

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayTs = today.getTime();

    return tasks.filter(t => {
       const taskDate = new Date(t.timestamp);
       taskDate.setHours(0,0,0,0);
       const isFromToday = taskDate.getTime() === todayTs;
       return isFromToday || !t.completed;
    });
  }, [tasks, listId]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => !t.completed), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.completed), [filteredTasks]);
  
  const xpPercentage = userProfile.nextLevelXP > 0 
    ? Math.min(100, Math.round((userProfile.currentXP / userProfile.nextLevelXP) * 100)) 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onAddTask(newTaskTitle, selectedDuration, selectedPriority);
    
    setNewTaskTitle('');
    setSelectedDuration(20);
    setSelectedPriority('Medium');
    setShowPriorityMenu(false);
    setShowDurationMenu(false);
    
    inputRef.current?.focus();
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

  const getPriorityIconColor = (p: TaskPriority) => {
    switch(p) {
        case 'Critical': return 'text-red-500';
        case 'High': return 'text-orange-400';
        case 'Medium': return 'text-blue-400';
        default: return 'text-sky-300';
    }
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
      <div className="flex-1 px-8 pb-24 overflow-hidden z-10">
        <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden border-white/5">
          <div className="flex items-center px-6 py-4 border-b border-white/5 bg-white/[0.02] text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex-1">Mission Objective</div>
          </div>

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
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Completed Today</span>
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
        </div>
      </div>

      {/* Add Task Bar */}
      <div className="absolute bottom-8 left-8 right-8 z-30">
        <form 
          onSubmit={handleSubmit} 
          className="w-full bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-4 pr-2 py-2 shadow-2xl flex items-center gap-3 focus-within:border-brand-primary/50 focus-within:shadow-[0_0_30px_rgba(204,255,0,0.2)] transition-all duration-300 relative group"
        >
           <div className="shrink-0 text-brand-primary/70 group-focus-within:text-brand-primary transition-colors">
              <Plus size={22} />
           </div>

           <input 
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Initialize new mission..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 font-medium h-10 text-lg"
           />

           <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
               <div className="relative" ref={priorityRef}>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPriorityMenu(!showPriorityMenu);
                      setShowDurationMenu(false);
                    }}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all hover:bg-white/10
                      ${getPriorityIconColor(selectedPriority)}
                    `}
                  >
                     <Flag size={16} fill={selectedPriority !== 'Medium' ? 'currentColor' : 'none'} />
                     <span className="hidden sm:inline-block">{selectedPriority}</span>
                  </button>

                  {showPriorityMenu && (
                     <div className="absolute bottom-full mb-3 right-0 w-32 bg-[#151921] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in-up p-1 z-50">
                        {PRIORITIES.map(p => (
                           <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                 setSelectedPriority(p.id);
                                 setShowPriorityMenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${p.color} hover:bg-white/5`}
                           >
                              <Flag size={12} className={p.id === selectedPriority ? 'fill-current' : ''} />
                              {p.label}
                           </button>
                        ))}
                     </div>
                  )}
               </div>

               <div className="w-px h-4 bg-white/10"></div>

               <div className="relative" ref={durationRef}>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDurationMenu(!showDurationMenu);
                      setShowPriorityMenu(false);
                    }}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all hover:bg-white/10
                      ${selectedDuration !== 20 ? 'text-brand-primary' : 'text-gray-400'}
                    `}
                  >
                     <Clock size={16} />
                     <span className="hidden sm:inline-block">{formatDurationChip(selectedDuration)}</span>
                  </button>

                  {showDurationMenu && (
                     <div className="absolute bottom-full mb-3 right-0 w-48 bg-[#151921] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in-up p-2 grid grid-cols-4 gap-1 z-50">
                        {DURATIONS.map(d => (
                           <button
                              key={d}
                              type="button"
                              onClick={() => {
                                 setSelectedDuration(d);
                                 setShowDurationMenu(false);
                              }}
                              className={`
                                flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors
                                ${selectedDuration === d 
                                   ? 'bg-brand-primary text-black' 
                                   : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }
                              `}
                           >
                              {formatDurationChip(d)}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
           </div>

           <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className={`
                 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                 ${newTaskTitle.trim() 
                    ? 'bg-brand-primary text-black hover:bg-brand-secondary hover:scale-105 shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                 }
              `}
           >
              <ArrowRight size={20} strokeWidth={2.5} />
           </button>
        </form>
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

        <div className="flex flex-col justify-center overflow-hidden w-full">
          <div className="flex items-center gap-2 w-full">
            {task.priority === 'Critical' && !task.completed && (
                <AlertCircle size={14} className="text-red-500 animate-pulse shrink-0" />
            )}
            <span className={`text-sm font-medium transition-colors truncate mr-2 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
              {task.title}
            </span>
            
            <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center gap-0.5 font-bold shrink-0">
               <Zap size={8} fill="currentColor" /> {task.xpWorth || 10}
            </span>

            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide font-bold shrink-0 ${getPriorityColor(task.priority || 'Medium')}`}>
              {task.priority || 'Medium'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
            {new Date(task.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {task.duration && <span className="flex items-center gap-1"><Clock size={10} /> {task.duration}m</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center">
         <button 
          onClick={() => onDeleteTask(task.id)}
          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white/5 rounded-lg"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

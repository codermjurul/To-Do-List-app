
import React, { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Check, Star, Trash2, Trophy, ChevronDown } from 'lucide-react';
import { Task } from '../types';

interface MissionLogProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const MissionLog: React.FC<MissionLogProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleComplete, 
  onToggleImportant,
  onDeleteTask
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  const xpPoints = completedTasks.length * 10;
  const totalPossibleXP = tasks.length * 10;
  const progressPercentage = totalPossibleXP > 0 ? (xpPoints / totalPossibleXP) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle);
    setNewTaskTitle('');
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header Area */}
      <div className="px-8 pt-8 pb-6 flex flex-col gap-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tasks Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your daily missions and productivity.</p>
          </div>
          
          <div className="flex items-center gap-6">
             {/* XP Progress Bar */}
             <div className="flex flex-col gap-2 w-64">
                <div className="flex justify-between items-center text-xs font-medium">
                   <div className="flex items-center gap-1.5 text-indigo-400">
                     <Trophy size={14} />
                     <span>XP Gained</span>
                   </div>
                   <span className="text-white">{xpPoints} <span className="text-gray-500">pts</span></span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                   {/* Glow behind the bar */}
                   <div className="absolute top-0 left-0 h-full bg-indigo-500/50 blur-[4px]" style={{ width: `${progressPercentage}%` }}></div>
                   {/* The actual bar */}
                   <div 
                     className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-500 ease-out"
                     style={{ width: `${progressPercentage}%` }}
                   ></div>
                </div>
             </div>

             <button className="p-2 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors">
               <Plus size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Task Table/List */}
      <div className="flex-1 px-8 pb-8 overflow-hidden z-10">
        <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
          
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02] text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-8">Task Name</div>
            <div className="col-span-2 text-right">Priority</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            
            {/* Active Tasks */}
            {activeTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={onToggleComplete} 
                onToggleImportant={onToggleImportant}
                onDeleteTask={onDeleteTask}
              />
            ))}

            {/* Empty State for Active Tasks */}
            {activeTasks.length === 0 && tasks.length > 0 && (
               <div className="py-8 text-center text-gray-500 text-sm italic opacity-50">
                  No active tasks. Great job!
               </div>
            )}
            
            {/* Completed Section Divider */}
            {completedTasks.length > 0 && (
              <div className="pt-6 pb-2 px-4">
                 <div className="flex items-center gap-3 text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Completed</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{completedTasks.length} Done</span>
                 </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={onToggleComplete} 
                onToggleImportant={onToggleImportant}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>

          {/* Quick Add Input at bottom */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSubmit} className="relative">
              <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
              />
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
      {/* Checkbox Column */}
      <div className="col-span-1 flex justify-center">
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={`
            w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
            ${task.completed 
              ? 'bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
              : 'border-gray-600 hover:border-gray-400 group-hover:bg-white/5'
            }
          `}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
      </div>

      {/* Task Title Column */}
      <div className="col-span-8 flex flex-col justify-center">
        <span className={`text-sm font-medium transition-colors ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
          {task.title}
        </span>
        {!task.completed && (
           <span className="text-[10px] text-gray-500 mt-0.5">Marketing • Due Today</span>
        )}
      </div>

      {/* Priority/Star Column */}
      <div className="col-span-2 flex justify-end">
         <button 
            onClick={() => onToggleImportant(task.id)}
            className={`transition-all duration-300 transform active:scale-90 ${task.isImportant ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100'}`}
         >
           <Star size={16} fill={task.isImportant ? "currentColor" : "none"} />
         </button>
      </div>

      {/* Action Column */}
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

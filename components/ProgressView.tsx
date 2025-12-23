
import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Plus, Zap, Trash2, CheckCircle, ChevronRight, Award, PlusCircle } from 'lucide-react';

interface ProgressViewProps {
  goals: Goal[];
  onCreateGoal: (title: string, target: number, unit: string) => void;
  onUpdateGoal: (id: string, newValue: number) => void;
  onDeleteGoal: (id: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ goals, onCreateGoal, onUpdateGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('Videos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTarget > 0) {
      onCreateGoal(newTitle.trim(), newTarget, newUnit.trim());
      setIsModalOpen(false);
      setNewTitle('');
      setNewTarget(10);
      setNewUnit('Videos');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in-up">
      <div className="p-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Quest Board</h1>
          <p className="text-gray-400 text-sm mt-1">Define long-term objectives and track your ascent.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-secondary text-black font-bold px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all flex items-center gap-2 text-sm uppercase tracking-wide group"
        >
          <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
          Initialize New Quest
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {goals.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
               <Target size={48} className="text-gray-600 mb-4" />
               <p className="text-gray-400 font-medium italic">No active quests detected.</p>
               <p className="text-xs text-gray-600 mt-2 uppercase tracking-widest">Initialize a mission to begin tracking.</p>
            </div>
          ) : (
            goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onIncrement={() => onUpdateGoal(goal.id, goal.currentValue + 1)} 
                onDelete={() => onDeleteGoal(goal.id)} 
              />
            ))
          )}
        </div>
      </div>

      {/* New Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#151921] border border-brand-primary/20 rounded-2xl p-8 shadow-2xl animate-fade-in-up">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <Award size={24} className="text-brand-primary" />
                   Define Mission
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                   <ChevronRight size={20} className="rotate-90" />
                </button>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Quest Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Publish YouTube Videos"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Target Value</label>
                    <input 
                      type="number" 
                      value={newTarget}
                      onChange={(e) => setNewTarget(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Unit</label>
                    <input 
                      type="text" 
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="Videos"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 flex items-center gap-3">
                   <Zap className="text-brand-primary" size={20} />
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Completion Reward</p>
                      <p className="text-sm font-bold text-brand-primary">{Math.floor(newTarget * 10)} XP Points</p>
                   </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  Confirm Quest
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

const GoalCard: React.FC<{ goal: Goal; onIncrement: () => void; onDelete: () => void }> = ({ goal, onIncrement, onDelete }) => {
  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  
  return (
    <div className={`
      relative glass-panel rounded-3xl p-6 border transition-all duration-300 group
      ${goal.isCompleted ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-white/5 hover:border-white/10'}
    `}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             {goal.isCompleted && <CheckCircle size={16} className="text-brand-primary" />}
             <h3 className={`text-lg font-bold tracking-tight ${goal.isCompleted ? 'text-brand-primary' : 'text-white'}`}>{goal.title}</h3>
          </div>
          <p className="text-xs text-gray-500 font-medium">Goal: {goal.targetValue} {goal.unit}</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={onDelete}
             className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
           >
              <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end mb-1">
           <div className="text-3xl font-black text-white tabular-nums">
              {goal.currentValue} <span className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-1">{goal.unit}</span>
           </div>
           <div className={`text-sm font-black ${goal.isCompleted ? 'text-brand-primary' : 'text-gray-400'}`}>
              {progress}%
           </div>
        </div>

        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
           <div 
             className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full transition-all duration-1000 ease-out relative"
             style={{ width: `${progress}%` }}
           >
              <div className="absolute top-0 right-0 h-full w-4 bg-white/30 blur-[4px]"></div>
           </div>
        </div>

        <div className="flex justify-between items-center pt-2">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              <Zap size={10} className="text-brand-primary" />
              Reward: {goal.xpReward} XP
           </div>
           
           {!goal.isCompleted && (
             <button 
               onClick={onIncrement}
               className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-primary hover:text-black rounded-xl text-xs font-bold transition-all border border-white/10 group-hover:border-brand-primary/50"
             >
                <Plus size={14} /> Add One {goal.unit.slice(0, -1)}
             </button>
           )}
           
           {goal.isCompleted && (
             <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] animate-pulse">
                Mission Accomplished
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

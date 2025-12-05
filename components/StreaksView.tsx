import React from 'react';
import { Flame, Trophy, Calendar } from 'lucide-react';

export const StreaksView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full p-8 overflow-hidden relative">
      <div className="z-10 flex flex-col h-full">
        <h1 className="text-3xl font-bold text-white mb-6">Streaks Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* Summary Card 1 */}
           <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Flame size={18} className="text-orange-500" />
               <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
             </div>
             <div className="text-4xl font-bold text-white">12 <span className="text-lg text-gray-500 font-medium">Days</span></div>
           </div>

           {/* Summary Card 2 */}
           <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Trophy size={18} className="text-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider">Total XP</span>
             </div>
             <div className="text-4xl font-bold text-white">2,450</div>
           </div>

           {/* Summary Card 3 */}
           <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Calendar size={18} className="text-purple-500" />
               <span className="text-xs font-semibold uppercase tracking-wider">Longest Streak</span>
             </div>
             <div className="text-4xl font-bold text-white">45 <span className="text-lg text-gray-500 font-medium">Days</span></div>
           </div>
        </div>

        <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center relative overflow-hidden">
           <div className="text-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
               <Flame size={24} className="text-gray-500" />
             </div>
             <h3 className="text-lg font-medium text-white mb-2">Detailed Analytics Coming Soon</h3>
             <p className="text-gray-500 text-sm max-w-xs mx-auto">Track your consistency and performance over time with detailed charts.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
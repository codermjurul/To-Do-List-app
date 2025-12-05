import React from 'react';
import { Book, PenTool } from 'lucide-react';

export const JournalView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full p-8 overflow-hidden relative">
      <div className="z-10 flex flex-col h-full">
        <h1 className="text-3xl font-bold text-white mb-2">Daily Journal</h1>
        <p className="text-gray-400 text-sm mb-6">Reflect on your progress and plan your next moves.</p>
        
        <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center relative overflow-hidden border border-dashed border-white/10">
           <div className="text-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
               <PenTool size={24} className="text-gray-500" />
             </div>
             <h3 className="text-lg font-medium text-white mb-2">Journal Module Locked</h3>
             <p className="text-gray-500 text-sm max-w-xs mx-auto">This module is under development. Soon you'll be able to document your journey here.</p>
             <button className="mt-6 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors">
               Notify me when ready
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
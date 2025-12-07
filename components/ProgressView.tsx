
import React, { useMemo } from 'react';
import { Task } from '../types';
import { TrendingUp, Activity, PieChart, Target, Zap, ArrowUpRight } from 'lucide-react';

interface ProgressViewProps {
  tasks: Task[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({ tasks }) => {
  
  // -- Helper Stats Calculation --
  const getStats = (category: string) => {
    const catTasks = tasks.filter(t => t.category === category);
    const total = catTasks.length;
    const completed = catTasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Simulate some "historical" data for visuals based on timestamps of completed items
    const history = catTasks
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(t => ({
        val: t.completed ? 1 : 0.2, // mock value
        time: t.timestamp
      }));

    return { total, completed, percentage, history };
  };

  const marketing = getStats('Marketing');
  const sales = getStats('Sales');
  const product = getStats('Product');
  const delivery = getStats('Delivery');
  const discipline = getStats('Discipline');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="p-8 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Performance metrics across all departments.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* 1. MARKETING - Bar Chart Style */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Marketing</h3>
                <div className="text-2xl font-bold text-white flex items-end gap-2">
                   {marketing.percentage}% <span className="text-xs font-normal text-gray-500 mb-1">Completion</span>
                </div>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                <TrendingUp size={18} />
              </div>
            </div>
            
            {/* Visual: Bar Chart */}
            <div className="h-32 flex items-end gap-2 justify-between mt-auto">
               {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                 <div key={i} className="w-full bg-white/5 rounded-t-sm relative group-hover:bg-white/10 transition-colors">
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all duration-1000"
                      style={{ height: `${(h * (marketing.percentage || 10)) / 100}%`, minHeight: '4px' }}
                    ></div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-600 uppercase font-bold">
               <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {/* 2. SALES - Line Chart / Area */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Sales</h3>
                <div className="text-2xl font-bold text-white flex items-end gap-2">
                   {sales.completed} <span className="text-xs font-normal text-gray-500 mb-1">Closed</span>
                </div>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 text-green-400">
                <ArrowUpRight size={18} />
              </div>
            </div>

            {/* Visual: Polyline Chart */}
            <div className="h-32 relative">
               <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <path d="M0,50 L0,30 L20,40 L40,20 L60,35 L80,10 L100,25 L100,50 Z" fill="rgba(34, 197, 94, 0.1)" />
                  <polyline 
                    points="0,30 20,40 40,20 60,35 80,10 100,25" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                  />
               </svg>
               {/* Data Points */}
               <div className="absolute top-[20%] right-[20%] w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse"></div>
            </div>
          </div>

          {/* 3. PRODUCT - Circular Progress / Donut */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
            <h3 className="absolute top-6 left-6 text-gray-400 text-xs font-bold uppercase tracking-wider">Product</h3>
            <div className="absolute top-6 right-6 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                <PieChart size={18} />
            </div>

            <div className="relative w-40 h-40 mt-4 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke="#3b82f6" 
                    strokeWidth="12" 
                    fill="none" 
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * product.percentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{product.percentage}%</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Shipped</span>
               </div>
            </div>
          </div>

          {/* 4. DELIVERY - Progress Bars List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden lg:col-span-2">
             <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Delivery</h3>
                <div className="text-xl font-bold text-white">Operations Pipeline</div>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-400">
                <Activity size={18} />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Infrastructure', val: 75, col: 'bg-orange-500' },
                { label: 'Logistics', val: 45, col: 'bg-yellow-500' },
                { label: 'Deployment', val: delivery.percentage || 20, col: 'bg-red-500' }
              ].map((item, i) => (
                <div key={i} className="group">
                   <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-300 font-medium">{item.label}</span>
                      <span className="text-gray-500 font-mono">{item.val}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.col} relative transition-all duration-1000`} 
                        style={{ width: `${item.val}%` }}
                      >
                         <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px]"></div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. DISCIPLINE - Gauge / Radar Concept */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
             <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Discipline</h3>
                <div className="text-lg font-bold text-white">Consistency Score</div>
              </div>
              <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20 text-brand-primary">
                <Target size={18} />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
               {/* Fake Radar/Gauge BG */}
               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-32 h-32 border border-white rounded-full"></div>
                  <div className="w-20 h-20 border border-white rounded-full absolute"></div>
                  <div className="w-full h-px bg-white absolute"></div>
                  <div className="h-full w-px bg-white absolute"></div>
               </div>

               <div className="relative z-10 text-center">
                  <div className="w-24 h-12 bg-white/5 rounded-t-full overflow-hidden relative border-t-2 border-l-2 border-r-2 border-brand-primary/50">
                     <div 
                        className="absolute bottom-0 left-1/2 w-1 h-full bg-brand-primary origin-bottom transition-transform duration-1000"
                        style={{ transform: `translateX(-50%) rotate(${(discipline.percentage || 0) * 1.8 - 90}deg)` }}
                     ></div>
                  </div>
                  <div className="mt-2 text-2xl font-black text-brand-primary">{discipline.percentage}<span className="text-sm align-top">%</span></div>
               </div>
            </div>
            
            <div className="mt-4 flex gap-2 justify-center">
               <div className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Focus</div>
               <div className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Will</div>
               <div className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Grit</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

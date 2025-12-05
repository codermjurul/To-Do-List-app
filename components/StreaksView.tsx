import React, { useMemo } from 'react';
import { Flame, Calendar as CalIcon } from 'lucide-react';
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  isToday, 
  subDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Task } from '../types';

interface StreaksViewProps {
  tasks: Task[];
}

export const StreaksView: React.FC<StreaksViewProps> = ({ tasks }) => {
  const today = new Date();

  // 1. Calculate Active Dates (Dates where at least one task was completed)
  const completedDates = useMemo(() => {
    // Get unique date strings for completed tasks
    const dates = new Set<string>();
    tasks.filter(t => t.completed).forEach(t => {
      dates.add(new Date(t.timestamp).toDateString());
    });
    return Array.from(dates).map(d => new Date(d));
  }, [tasks]);

  // 2. Calculate Current Streak
  const streakCount = useMemo(() => {
    let streak = 0;
    // Check today
    const hasToday = completedDates.some(d => isSameDay(d, today));
    
    // Look backwards from yesterday
    let checkDate = subDays(today, 1);
    let keepGoing = true;

    // Check yesterday first
    while (keepGoing) {
      if (completedDates.some(d => isSameDay(d, checkDate))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        keepGoing = false;
      }
    }
    
    return hasToday ? streak + 1 : streak;
  }, [completedDates]);

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center p-8 overflow-hidden relative">
      <div className="w-full max-w-lg flex flex-col items-center z-10">
        
        {/* Massive Animated Flame */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full animate-pulse"></div>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
             <Flame size={160} className="text-brand-primary drop-shadow-[0_0_35px_rgba(204,255,0,0.6)] animate-bounce-slow absolute top-0" fill="currentColor" />
             <Flame size={100} className="text-yellow-200 absolute top-8 opacity-60 mix-blend-overlay" fill="currentColor" />
          </div>
        </div>

        {/* Streak Counter */}
        <div className="text-center mb-8">
           <h1 className="text-[80px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-brand-primary to-green-500 drop-shadow-2xl">
             {streakCount}
           </h1>
           <p className="text-xl font-bold text-brand-primary uppercase tracking-[0.2em] mt-2 drop-shadow-lg">Day Streak</p>
        </div>

        {/* Live Calendar Card */}
        <div className="w-full glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-[#0B0E14]/80">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
                <CalIcon size={18} className="text-gray-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">{format(today, 'MMMM yyyy')}</span>
             </div>
             <div className="text-xs font-medium text-gray-500">
               {completedDates.length} Days Worked
             </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['S','M','T','W','T','F','S'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-600 mb-2">{d}</div>
            ))}
            
            {calendarDays.map((date, index) => {
              const isWorked = completedDates.some(d => isSameDay(d, date));
              const isCurrentMonth = date.getMonth() === today.getMonth();
              const isTodayDate = isToday(date);

              return (
                <div key={index} className="flex justify-center mb-1">
                   <div 
                     className={`
                       w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                       ${!isCurrentMonth ? 'opacity-20' : ''}
                       ${isWorked 
                         ? 'bg-brand-primary text-black shadow-[0_0_10px_rgba(204,255,0,0.4)] scale-105' 
                         : isTodayDate 
                           ? 'border border-brand-primary text-brand-primary'
                           : 'text-gray-500 hover:bg-white/5'
                       }
                     `}
                   >
                     {isWorked ? <Flame size={14} fill="black" /> : format(date, 'd')}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
import React, { useMemo } from 'react';
import { startOfWeek, addDays, isSameDay, format, isFuture } from 'date-fns';
import { Flame } from 'lucide-react';

interface StreakCalendarProps {
  completedDates: number[]; // timestamps
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ completedDates }) => {
  const today = new Date();
  
  // Generate current week days (starting Monday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  // Calculate current streak (naive implementation for prototype)
  const currentStreak = useMemo(() => {
    let streak = 0;
    // For demo purposes, let's assume if today is active, streak is at least 1 + some random history or calculated from completedDates properly
    // Real logic would look backwards from today.
    // Here we just count how many days in this week are active up to today for the UI visual
    const todayStr = new Date().toDateString();
    const hasToday = completedDates.some(d => new Date(d).toDateString() === todayStr);
    return hasToday ? 5 : 4; // Mocking a "5 day streak" if today is done, else 4.
  }, [completedDates]);

  const isDateCompleted = (date: Date) => {
    return completedDates.some(timestamp => isSameDay(new Date(timestamp), date));
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            Weekly Intensity
          </h3>
          <p className="text-gray-500 text-sm mt-1">Consistency is the key to dominance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-900/50 px-4 py-2 rounded-full border border-dark-700/50 backdrop-blur-md">
          <Flame className={`${currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-600'} animate-pulse`} size={20} />
          <span className="font-bold text-white tabular-nums">{currentStreak} Day Streak</span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2 relative z-10">
        {weekDays.map((date, index) => {
          const active = isDateCompleted(date);
          const isCurrentDay = isSameDay(date, today);
          const isFutureDate = isFuture(date) && !isCurrentDay;
          
          return (
            <div key={index} className="flex flex-col items-center gap-3 flex-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isCurrentDay ? 'text-brand-accent' : 'text-gray-500'}`}>
                {format(date, 'EEE')}
              </span>
              
              <div 
                className={`
                  w-full h-14 rounded-xl flex items-center justify-center border transition-all duration-300 relative
                  ${active 
                    ? 'bg-gradient-to-br from-brand-accent to-purple-600 border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                    : isFutureDate
                      ? 'bg-dark-900/30 border-dark-700 opacity-50'
                      : 'bg-dark-900 border-dark-700'
                  }
                  ${isCurrentDay && !active ? 'border-brand-accent border-dashed animate-pulse' : ''}
                `}
              >
                {active && (
                   <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                   </svg>
                )}
                {!active && !isFutureDate && (
                    <div className="w-2 h-2 rounded-full bg-dark-600"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

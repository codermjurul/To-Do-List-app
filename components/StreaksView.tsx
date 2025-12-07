import React, { useMemo, useState } from 'react';
import { Flame, Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  subDays
} from 'date-fns';
import { Task } from '../types';

interface StreaksViewProps {
  tasks: Task[];
  timezone: string;
}

export const StreaksView: React.FC<StreaksViewProps> = ({ tasks, timezone }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // Helper: Format a date object to 'YYYY-MM-DD' in the user's specific timezone.
  // This is crucial for consistent grouping regardless of the browser's local time.
  const getDateStringInTimezone = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // 1. Calculate Active Dates (Set of 'YYYY-MM-DD' strings)
  const completedDateStrings = useMemo(() => {
    const dates = new Set<string>();
    tasks.filter(t => t.completed).forEach(t => {
      dates.add(getDateStringInTimezone(new Date(t.timestamp)));
    });
    return dates;
  }, [tasks, timezone]);

  // 2. Calculate Current Streak (Enhanced Logic)
  const streakCount = useMemo(() => {
    const now = new Date();
    const todayStr = getDateStringInTimezone(now);
    
    // Check Yesterday in the specific timezone (safer than simple subtract for edge cases)
    const yesterday = subDays(now, 1);
    const yesterdayStr = getDateStringInTimezone(yesterday);

    let currentCheckDate: Date;
    let streak = 0;

    // Determine start point for streak calculation
    if (completedDateStrings.has(todayStr)) {
      // User did a task today -> Streak is active ending today
      currentCheckDate = now;
    } else if (completedDateStrings.has(yesterdayStr)) {
      // User hasn't done task today, but did yesterday -> Streak is held ending yesterday
      currentCheckDate = yesterday;
    } else {
      // User missed yesterday and today -> Streak broken
      return 0;
    }

    // Count backwards consecutively
    let keepGoing = true;
    while (keepGoing) {
      const dateStr = getDateStringInTimezone(currentCheckDate);
      
      if (completedDateStrings.has(dateStr)) {
        streak++;
        // Move to previous day
        currentCheckDate = subDays(currentCheckDate, 1);
      } else {
        keepGoing = false;
      }
    }
    
    return streak;
  }, [completedDateStrings, timezone]);

  // Calendar Grid Generation (Visual)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const handleJumpToToday = () => setViewDate(new Date());

  const todayStr = getDateStringInTimezone(new Date());

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-start p-8 overflow-y-auto custom-scrollbar relative">
      <div className="w-full max-w-2xl flex flex-col items-center z-10 pt-4">
        
        {/* Massive Animated Flame & Score */}
        <div className="flex items-center gap-8 mb-12">
            <div className="relative group cursor-pointer hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full animate-pulse-slow"></div>
            <div className="relative w-32 h-32 flex items-center justify-center">
                <Flame size={128} className="text-brand-primary drop-shadow-[0_0_40px_rgba(204,255,0,0.6)] animate-fire absolute top-0" fill="currentColor" />
                <Flame size={80} className="text-yellow-100 absolute top-6 opacity-70 mix-blend-overlay animate-fire-inner" fill="currentColor" />
            </div>
            </div>
            
            <div className="text-left">
                <h1 className="text-7xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-brand-primary to-green-500 drop-shadow-2xl">
                    {streakCount}
                </h1>
                <p className="text-lg font-bold text-brand-primary uppercase tracking-[0.2em] mt-1 drop-shadow-lg">Day Streak</p>
            </div>
        </div>

        {/* Live Calendar Card */}
        <div className="w-full glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-[#0B0E14]/80">
          
          {/* Header & Controls */}
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <CalIcon size={18} className="text-brand-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wide">{format(viewDate, 'MMMM yyyy')}</h2>
                    <p className="text-xs text-gray-500 font-medium">{timezone}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                 <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                     <ChevronLeft size={20} />
                 </button>
                 <button onClick={handleJumpToToday} className="px-3 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-brand-primary transition-colors uppercase">
                     Today
                 </button>
                 <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                     <ChevronRight size={20} />
                 </button>
             </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-4">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">{d}</div>
            ))}
            
            {calendarDays.map((date, index) => {
              // Convert the calendar grid date to the Target Timezone string to check status
              const gridDateStr = getDateStringInTimezone(date);
              
              const isWorked = completedDateStrings.has(gridDateStr);
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isTodayDate = gridDateStr === todayStr;

              return (
                <div key={index} className="flex flex-col items-center justify-center min-h-[50px]">
                   <div 
                     className={`
                       relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                       ${!isCurrentMonth ? 'opacity-20 grayscale' : ''}
                       ${isWorked 
                         ? 'bg-brand-primary text-black shadow-[0_0_15px_rgba(204,255,0,0.5)] scale-110 z-10' 
                         : isTodayDate 
                           ? 'border-2 border-brand-primary text-brand-primary'
                           : 'text-gray-500 hover:bg-white/5'
                       }
                     `}
                   >
                     {isWorked ? (
                        <Flame size={18} fill="black" className="animate-pulse" />
                     ) : (
                        format(date, 'd')
                     )}
                     
                     {/* Today Indicator Dot if not worked yet */}
                     {isTodayDate && !isWorked && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                     )}
                   </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="mt-6 text-gray-500 text-xs text-center max-w-sm">
            Your streak is calculated based on the <span className="text-brand-primary">{timezone}</span> timezone. 
            You can change this in Settings.
        </p>

      </div>
    </div>
  );
};
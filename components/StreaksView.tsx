import React, { useMemo, useState } from 'react';
import { Flame, Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, Zap } from 'lucide-react';
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  subDays,
  isSameDay
} from 'date-fns';
import { Task, SessionRecord } from '../types';

interface StreaksViewProps {
  tasks: Task[];
  timezone: string;
  sessions: SessionRecord[];
  streakStartTimestamp?: number;
}

export const StreaksView: React.FC<StreaksViewProps> = ({ tasks, timezone, sessions, streakStartTimestamp = 0 }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // Filter tasks based on reset timestamp
  const validTasks = useMemo(() => {
    return tasks.filter(t => t.completed && t.timestamp >= streakStartTimestamp);
  }, [tasks, streakStartTimestamp]);

  // Helper: Format a date object to 'YYYY-MM-DD' in the user's specific timezone.
  const getDateStringInTimezone = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // 1. Calculate Active Dates and Daily Stats
  const dailyStats = useMemo(() => {
    const stats = new Map<string, { tasks: number, xp: number, hours: number }>();
    
    // Process Tasks
    validTasks.forEach(t => {
      const dateKey = getDateStringInTimezone(new Date(t.timestamp));
      const current = stats.get(dateKey) || { tasks: 0, xp: 0, hours: 0 };
      stats.set(dateKey, {
        ...current,
        tasks: current.tasks + 1,
        xp: current.xp + (t.xpWorth || 0)
      });
    });

    // Process Sessions for Hours
    sessions.forEach(s => {
       const dateKey = getDateStringInTimezone(new Date(s.started_at));
       const current = stats.get(dateKey) || { tasks: 0, xp: 0, hours: 0 };
       stats.set(dateKey, {
         ...current,
         hours: current.hours + (s.duration_seconds / 3600)
       });
    });

    return stats;
  }, [validTasks, sessions, timezone]);

  const completedDateStrings = useMemo(() => {
     return new Set(dailyStats.keys());
  }, [dailyStats]);

  // 2. Calculate Current Streak
  const streakCount = useMemo(() => {
    const now = new Date();
    const todayStr = getDateStringInTimezone(now);
    
    const yesterday = subDays(now, 1);
    const yesterdayStr = getDateStringInTimezone(yesterday);

    let currentCheckDate: Date;
    let streak = 0;

    if (completedDateStrings.has(todayStr) && dailyStats.get(todayStr)!.tasks > 0) {
      currentCheckDate = now;
    } else if (completedDateStrings.has(yesterdayStr) && dailyStats.get(yesterdayStr)!.tasks > 0) {
      currentCheckDate = yesterday;
    } else {
      return 0;
    }

    let keepGoing = true;
    while (keepGoing) {
      const dateStr = getDateStringInTimezone(currentCheckDate);
      // Ensure we only count days where TASKS were actually done for the streak logic usually
      // Assuming tasks > 0 for streak
      if (completedDateStrings.has(dateStr) && dailyStats.get(dateStr)!.tasks > 0) {
        streak++;
        currentCheckDate = subDays(currentCheckDate, 1);
      } else {
        keepGoing = false;
      }
    }
    
    return streak;
  }, [completedDateStrings, dailyStats, timezone]);

  // Calendar Grid
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
    <div className="flex-1 flex flex-col h-full items-center justify-start p-8 overflow-y-auto custom-scrollbar relative animate-fade-in-up">
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
        <div className="w-full glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-visible backdrop-blur-xl bg-[#0B0E14]/80">
          
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
              const gridDateStr = getDateStringInTimezone(date);
              const isWorked = completedDateStrings.has(gridDateStr);
              const stats = dailyStats.get(gridDateStr);
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isTodayDate = gridDateStr === todayStr;

              // Only show tooltip for days with meaningful data
              const hasData = isWorked;

              return (
                <div key={index} className="flex flex-col items-center justify-center min-h-[50px] relative group/day z-0 hover:z-50">
                   <div 
                     className={`
                       relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-default
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
                     
                     {isTodayDate && !isWorked && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                     )}
                   </div>

                   {/* HOVER POPUP */}
                   {hasData && (
                     <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-[#0B0E14] border border-brand-primary/20 rounded-xl p-3 shadow-2xl opacity-0 group-hover/day:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2 uppercase tracking-wide text-center">
                          {format(date, 'MMM do, yyyy')}
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                 <CheckCircle size={10} />
                                 <span>Tasks</span>
                              </div>
                              <span className="font-bold text-white">{stats?.tasks || 0}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                 <Zap size={10} />
                                 <span>XP Gained</span>
                              </div>
                              <span className="font-bold text-brand-primary">{stats?.xp || 0}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                 <Clock size={10} />
                                 <span>Hours</span>
                              </div>
                              <span className="font-bold text-white">{(stats?.hours || 0).toFixed(1)}h</span>
                           </div>
                        </div>
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0B0E14] border-r border-b border-brand-primary/20 rotate-45"></div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
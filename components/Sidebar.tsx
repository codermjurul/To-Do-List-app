

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Book, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Pause,
  Play,
  Square,
  BarChart2,
  Clock,
  Trophy,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ViewType, UserProfile, AppSettings, SessionState } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userProfile: UserProfile;
  appSettings: AppSettings;
  sessionState: SessionState;
  onStartSession: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  userProfile,
  appSettings,
  sessionState,
  onStartSession,
  onPauseSession,
  onStopSession
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileStats, setShowProfileStats] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000); // Update every second to sync if needed
    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // Calculate XP percentage
  const xpPercentage = userProfile.nextLevelXP > 0 
    ? Math.min(100, Math.round((userProfile.currentXP / userProfile.nextLevelXP) * 100)) 
    : 0;

  return (
    <aside 
      className={`
        flex flex-col h-full border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-xl relative z-20 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[80px]' : 'w-[320px]'}
      `}
    >
      {/* Top Header Section - Date/Time OR Session Timer */}
      <div className={`pt-8 px-6 pb-2 ${isCollapsed ? 'px-4' : 'px-6'}`}>
        <div className={`flex flex-col ${isCollapsed ? 'items-center' : 'items-start'} w-full mb-10 h-[80px] justify-center relative`}>
          {!isCollapsed && (
             <div className="relative w-full">
                {/* Mode 1: Date & Time (Visible when NO Session) */}
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 left-0 w-full transition-all duration-500 ease-in-out ${sessionState.isActive ? 'opacity-0 -translate-y-8 pointer-events-none' : 'opacity-100'}`}
                >
                   <div className="flex items-center justify-between w-full">
                      <div>
                        <h1 className="text-5xl font-black text-white tracking-normal leading-none mb-1">
                            {format(currentDate, 'h:mm a')}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs ml-1">
                            {format(currentDate, 'EEEE, do MMMM')}
                        </p>
                      </div>
                      
                      {/* Play Button */}
                      <button 
                        onClick={onStartSession}
                        className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-brand-primary hover:bg-brand-secondary transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] active:scale-95 shrink-0"
                      >
                         <Play size={22} className="text-black ml-0.5 fill-black" />
                      </button>
                   </div>
                </div>

                {/* Mode 2: Session Timer (Visible when Session Active) */}
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 left-0 w-full transition-all duration-500 ease-in-out ${!sessionState.isActive ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100'}`}
                >
                   <div className="flex items-center justify-between w-full">
                      <h1 className="text-5xl font-black text-brand-primary tracking-normal leading-none tabular-nums font-mono">
                          {formatSessionTime(sessionState.elapsedSeconds)}
                      </h1>
                      
                      {/* Split Controls */}
                      <div className="flex flex-col gap-2 shrink-0">
                         <button 
                           onClick={onPauseSession}
                           className="w-10 h-10 rounded-full bg-white/10 hover:bg-yellow-500/20 text-white hover:text-yellow-400 border border-white/5 hover:border-yellow-500/50 flex items-center justify-center transition-all duration-300"
                           title={sessionState.isPaused ? "Resume" : "Pause"}
                         >
                            {sessionState.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                         </button>
                         <button 
                           onClick={onStopSession}
                           className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/5 hover:border-red-500/50 flex items-center justify-center transition-all duration-300"
                           title="Stop Session"
                         >
                            <Square size={14} fill="currentColor" />
                         </button>
                      </div>
                   </div>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2 animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Recording Session
                   </p>
                </div>
             </div>
          )}
        </div>

        {/* User Profile Section with Popover Stats */}
        <div className={`mb-8 flex flex-col gap-4 transition-all duration-300 ${isCollapsed ? 'items-center' : 'w-full'} ${!isCollapsed ? 'mt-4' : ''} relative`}>
          
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-3' : 'justify-between w-full'}`}>
            <div 
              className={`flex items-center cursor-pointer ${isCollapsed ? 'justify-center' : 'gap-4'}`}
              onClick={() => setShowProfileStats(!showProfileStats)}
            >
              <div className="relative group">
                {/* Dynamic Avatar with Zoom */}
                <div className={`rounded-full overflow-hidden border-2 border-brand-primary/30 shadow-[0_0_15px_rgba(204,255,0,0.15)] group-hover:border-brand-primary transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'}`}>
                  <img 
                    src={userProfile.avatarUrl} 
                    alt={userProfile.name} 
                    className="w-full h-full object-cover object-center bg-gray-800"
                    style={{ transform: `scale(${userProfile.zoom})` }}
                  />
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-primary rounded-full border-2 border-[#0B0E14] shadow-[0_0_8px_rgba(204,255,0,0.8)]"></div>
              </div>
              
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h2 className="text-lg font-bold text-white leading-tight hover:text-brand-primary transition-colors">{userProfile.name}</h2>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="px-1.5 py-0.5 rounded-sm bg-brand-primary/10 border border-brand-primary/20">
                          <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wide leading-none">{userProfile.gamerTag}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Lvl {userProfile.level}</p>
                    </div>
                    
                    {/* Level Progress Bar */}
                    <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden" title={`${userProfile.currentXP} / ${userProfile.nextLevelXP} XP`}>
                       <div 
                         className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out"
                         style={{ width: `${xpPercentage}%` }}
                       ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Streaks Button (Repositioned) - Icon size increased by ~3% */}
            {!isCollapsed && (
              <button
                onClick={() => onViewChange('streaks')}
                className={`
                  group/streak relative flex items-center justify-center rounded-full transition-all duration-300 shrink-0
                  ${currentView === 'streaks' 
                      ? 'bg-brand-primary text-black shadow-[0_0_15px_rgba(204,255,0,0.4)] scale-110' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-brand-primary'
                  }
                  w-11 h-11
                `}
                title="View Streaks"
              >
                <div className={`absolute inset-0 bg-brand-primary/30 rounded-full blur-md transition-opacity duration-300 ${currentView === 'streaks' ? 'opacity-100' : 'opacity-0 group-hover/streak:opacity-100'}`}></div>
                <Flame size={22} className={`relative z-10 transition-transform duration-300 group-hover/streak:scale-110 ${currentView === 'streaks' ? 'fill-black' : 'fill-none'}`} />
              </button>
            )}
          </div>

          {/* Profile Stats Popover */}
          {showProfileStats && !isCollapsed && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#0B0E14] border border-brand-primary/30 rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center">
                    <Clock size={16} className="text-brand-primary mb-1" />
                    <span className="text-xl font-bold text-white leading-none">
                      {userProfile.stats?.totalHours.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">Total Hours</span>
                 </div>
                 <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center">
                    <Target size={16} className="text-brand-secondary mb-1" />
                    <span className="text-xl font-bold text-white leading-none">
                      {userProfile.stats?.totalTasksCompleted || '0'}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">Completed</span>
                 </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-white/10">
                 <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                    <span className="uppercase tracking-wider">Current Level Progress</span>
                    <span className="text-brand-primary">{userProfile.currentXP} / {userProfile.nextLevelXP} XP</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full transition-all duration-500"
                      style={{ width: `${xpPercentage}%` }}
                    ></div>
                 </div>
              </div>
            </div>
          )}
          
          {/* Overlay to close popover */}
          {showProfileStats && (
             <div className="fixed inset-0 z-40" onClick={() => setShowProfileStats(false)}></div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {!isCollapsed && <p className="px-4 text-xs font-bold text-gray-600 mb-2 uppercase tracking-widest">Overview</p>}
          
          <NavItem 
            icon={<CheckSquare size={18} />} 
            label="To Do" 
            isActive={currentView === 'tasks'} 
            onClick={() => onViewChange('tasks')}
            isCollapsed={isCollapsed}
          />

          <NavItem 
            icon={<BarChart2 size={18} />} 
            label="Progress" 
            isActive={currentView === 'progress'} 
            onClick={() => onViewChange('progress')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            icon={<Book size={18} />} 
            label="Journal" 
            isActive={currentView === 'journal'} 
            onClick={() => onViewChange('journal')}
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className={`mt-auto p-6 ${isCollapsed ? 'px-2 flex flex-col items-center gap-4' : 'flex items-center justify-between'}`}>
         {/* Settings Button */}
         <div 
           onClick={() => onViewChange('settings')}
           className={`
             group flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-300
             ${isCollapsed ? 'justify-center p-2' : 'px-4 py-3'}
             ${currentView === 'settings' ? 'text-brand-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}
           `}
         >
            <Settings size={18} className={`${currentView === 'settings' ? 'text-brand-primary' : 'group-hover:text-white'}`} />
            {!isCollapsed && <span className="text-sm font-medium tracking-wide">Settings</span>}
         </div>

         <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors
              ${isCollapsed ? '' : ''}
            `}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isCollapsed }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative group flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-300
        ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}
        ${isActive 
          ? 'bg-gradient-to-r from-white/10 to-transparent border border-white/10 text-white shadow-lg shadow-black/20' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }
      `}
      title={isCollapsed ? label : undefined}
    >
      {/* Active Indicator Glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-primary/10 to-transparent opacity-50 blur-sm pointer-events-none"></div>
      )}
      
      {/* Sidebar Accent Bar */}
      {isActive && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-brand-primary rounded-r-full shadow-[0_0_10px_rgba(204,255,0,0.6)] ${isCollapsed ? 'h-3 left-0' : 'h-6'}`}></div>
      )}

      <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-100 text-brand-primary' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      
      {!isCollapsed && (
        <span className="relative z-10 text-sm font-medium tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}
      
      {/* Hover Light Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};
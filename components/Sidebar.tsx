
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Book, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Timer,
  Pause,
  Play,
  Square,
  BarChart2
} from 'lucide-react';
import { format } from 'date-fns';
import { ViewType, TimerState, UserProfile, AppSettings } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  timerState: TimerState;
  onTogglePauseTimer: () => void;
  onStopTimer: () => void;
  userProfile: UserProfile;
  appSettings: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  timerState,
  onTogglePauseTimer,
  onStopTimer,
  userProfile,
  appSettings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = timerState.totalSeconds > 0 
    ? ((timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds) * 100 
    : 0;

  // Extract ID from URI and add autoplay
  const getSpotifyEmbedUrl = (uri: string) => {
    if (!uri) return '';
    const parts = uri.split(':');
    const type = parts[1];
    const id = parts[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0&autoplay=1`;
  };

  return (
    <aside 
      className={`
        flex flex-col h-full border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-xl relative z-20 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[80px]' : 'w-[320px]'}
      `}
    >
      {/* Top Header Section - Date/Time */}
      <div className={`pt-8 px-6 pb-2 ${isCollapsed ? 'px-4' : 'px-6'}`}>
        <div className={`flex flex-col ${isCollapsed ? 'items-center' : 'items-start'} mb-10`}>
          {!isCollapsed && (
             <>
               <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-1">
                  {format(currentDate, 'h:mm a')}
               </h1>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs ml-1">
                  {format(currentDate, 'do MMMM')}
               </p>
             </>
          )}
        </div>

        {/* User Profile Section */}
        <div className={`mb-8 flex flex-col gap-4 transition-all duration-300 ${isCollapsed ? 'items-center' : ''} ${!isCollapsed ? 'mt-4' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => onViewChange('settings')}>
              {/* Dynamic Avatar with Zoom */}
              <div className={`rounded-full overflow-hidden border-2 border-brand-primary/30 shadow-[0_0_15px_rgba(204,255,0,0.15)] group-hover:border-brand-primary/80 transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'}`}>
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
                <h2 className="text-lg font-bold text-white leading-tight">{userProfile.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="px-1.5 py-0.5 rounded-sm bg-brand-primary/10 border border-brand-primary/20">
                      <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wide leading-none">{userProfile.gamerTag}</p>
                   </div>
                   <p className="text-xs text-gray-500 font-medium">Lvl {userProfile.level}</p>
                </div>
              </div>
            )}
          </div>

          {/* Active Timer Widget */}
          {timerState.isActive && (
            <div className={`w-full bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 relative overflow-hidden transition-all ${isCollapsed ? 'hidden' : 'block'}`}>
              <div className="flex justify-between items-center mb-2 z-10 relative">
                 <div className="flex items-center gap-2 text-brand-primary">
                    <Timer size={14} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Focus Mode</span>
                 </div>
                 <div className="text-sm font-mono font-bold text-white tabular-nums">
                    {formatTime(timerState.remainingSeconds)}
                 </div>
              </div>
              
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 z-10 relative">
                 <div 
                   className="h-full bg-brand-primary transition-all duration-1000 ease-linear"
                   style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>

              {/* Spotify Player Embed */}
              {timerState.spotifyUri && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10 h-[80px]">
                  <iframe 
                    style={{ borderRadius: '12px' }} 
                    src={getSpotifyEmbedUrl(timerState.spotifyUri)} 
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allowFullScreen 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  ></iframe>
                </div>
              )}

              <div className="flex gap-2 z-10 relative">
                 <button 
                    onClick={onTogglePauseTimer}
                    className="flex-1 bg-white/10 hover:bg-white/20 h-7 rounded flex items-center justify-center transition-colors"
                 >
                    {timerState.isPaused ? <Play size={12} fill="white" /> : <Pause size={12} fill="white" />}
                 </button>
                 <button 
                    onClick={onStopTimer}
                    className="flex-1 bg-white/10 hover:bg-red-500/20 hover:text-red-400 h-7 rounded flex items-center justify-center transition-colors"
                 >
                    <Square size={12} fill="currentColor" />
                 </button>
              </div>

              {/* Background fill based on progress */}
              <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none" style={{ clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }}></div>
            </div>
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
            icon={<Flame size={18} />} 
            label="Streaks" 
            isActive={currentView === 'streaks'} 
            onClick={() => onViewChange('streaks')}
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
         {/* Settings Button - Aligned with NavItems */}
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


import React, { useState } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Book, 
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`
        flex flex-col h-full border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-xl relative z-20 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[80px]' : 'w-[300px]'}
      `}
    >
      {/* Top Header Section */}
      <div className={`p-6 ${isCollapsed ? 'px-4' : 'px-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                 <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                   <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                 </svg>
               </div>
               <div className="overflow-hidden whitespace-nowrap">
                 <h1 className="text-white font-bold text-base leading-none tracking-tight">Quantix</h1>
                 <span className="text-xs text-gray-500 font-medium">Agency HUD</span>
               </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors
              ${isCollapsed ? 'mx-auto' : ''}
            `}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Welcome Section */}
        {!isCollapsed ? (
          <div className="mb-8 overflow-hidden whitespace-nowrap transition-opacity duration-300 opacity-100">
            <h2 className="text-2xl font-semibold text-white mb-1">
              Welcome<br/>Back, Manjarul
            </h2>
            <p className="text-xs text-gray-500">Last login: 15 Jun 2025</p>
          </div>
        ) : (
           <div className="mb-8 h-[60px] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white">
                M
              </div>
           </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {!isCollapsed && <p className="px-4 text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Overview</p>}
          
          <NavItem 
            icon={<CheckSquare size={20} />} 
            label="Tasks" 
            isActive={currentView === 'tasks'} 
            onClick={() => onViewChange('tasks')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            icon={<Flame size={20} />} 
            label="Streaks" 
            isActive={currentView === 'streaks'} 
            onClick={() => onViewChange('streaks')}
            isCollapsed={isCollapsed}
          />
          
          <NavItem 
            icon={<Book size={20} />} 
            label="Journal" 
            isActive={currentView === 'journal'} 
            onClick={() => onViewChange('journal')}
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className={`mt-auto p-6 ${isCollapsed ? 'px-2' : ''}`}>
         <div className={`flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer transition-colors ${isCollapsed ? 'justify-center p-2' : 'px-4 py-2'}`}>
            <Settings size={18} />
            {!isCollapsed && <span className="text-sm">Settings</span>}
         </div>
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
        ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3.5'}
        ${isActive 
          ? 'bg-gradient-to-r from-white/10 to-transparent border border-white/10 text-white shadow-lg shadow-black/20' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }
      `}
      title={isCollapsed ? label : undefined}
    >
      {/* Active Indicator Glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/5 opacity-50 blur-sm pointer-events-none"></div>
      )}
      
      {/* Sidebar Accent Bar */}
      {isActive && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)] ${isCollapsed ? 'h-4 left-0' : 'h-8'}`}></div>
      )}

      <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'group-hover:scale-110'}`}>
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

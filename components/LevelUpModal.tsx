import React, { useEffect, useState } from 'react';
import { Trophy, Star, ChevronRight } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ newLevel, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to ensure animation plays cleanly after mount
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div 
      onClick={onClose}
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer transition-opacity duration-500
        ${show ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="relative flex flex-col items-center">
        {/* Burst Background */}
        <div className="absolute inset-0 bg-brand-primary/20 blur-[100px] rounded-full animate-pulse-slow"></div>
        
        {/* Icon */}
        <div className={`
           mb-8 relative transform transition-all duration-700 ease-out
           ${show ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
        `}>
           <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-primary to-green-600 flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.6)] animate-bounce">
              <Trophy size={64} className="text-black fill-black" />
           </div>
           {/* Stars */}
           <Star className="absolute -top-4 -right-4 text-yellow-400 fill-yellow-400 animate-spin-slow" size={32} />
           <Star className="absolute -bottom-2 -left-4 text-white fill-white animate-pulse" size={24} />
        </div>

        {/* Text */}
        <h2 className={`
           text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 italic tracking-tighter mb-2 transition-all duration-700 delay-100
           ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
           LEVEL UP
        </h2>
        
        <div className={`
           flex items-center gap-4 text-4xl font-bold text-brand-primary transition-all duration-700 delay-200
           ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
           <span className="text-gray-600">Lvl {newLevel - 1}</span>
           <ChevronRight size={32} />
           <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Lvl {newLevel}</span>
        </div>

        <p className={`
           mt-8 text-gray-500 uppercase tracking-[0.3em] text-xs transition-all duration-700 delay-300
           ${show ? 'opacity-100' : 'opacity-0'}
        `}>
           Click anywhere to claim rewards
        </p>

      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { UserProfile, AppSettings, AppTheme } from '../types';
import { Camera, RefreshCw, ZoomIn, Globe, Clock, Sparkles, Palette, AlertTriangle, Trash2, Award, X, Check, Grid, Fingerprint, Database } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SettingsViewProps {
  userProfile: UserProfile;
  appSettings: AppSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateAppSettings: (settings: AppSettings) => void;
  onResetLevel: () => void;
  onResetStreaks: () => void;
}

const TIMEZONES = [
  "UTC", "Asia/Dhaka", "Asia/Kolkata", "Asia/Tokyo", "Asia/Dubai", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "America/Chicago", "Australia/Sydney"
];

const THEMES: { id: AppTheme; name: string; color: string }[] = [
  { id: 'neon-lime', name: 'Neon Lime', color: '#CCFF00' },
  { id: 'crimson-red', name: 'Crimson Red', color: '#EF4444' },
  { id: 'cyan-blue', name: 'Cyan Blue', color: '#06B6D4' },
  { id: 'royal-purple', name: 'Royal Purple', color: '#D946EF' },
  { id: 'sunset-orange', name: 'Sunset Orange', color: '#F97316' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, appSettings, onUpdateProfile, onUpdateAppSettings, onResetLevel, onResetStreaks }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<'level' | 'streak' | 'id' | null>(null);

  const deviceId = localStorage.getItem('agency_hud_device_id') || 'Not Found';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateProfile({ ...userProfile, avatarUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in-up">
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-[#0B0E14] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up text-center">
              <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nuclear Protocol Initiated</h3>
              <p className="text-gray-400 text-sm mb-6">
                 {confirmAction === 'id' 
                    ? "This will wipe your current Identity (ID) and Level on this domain. Use this to fix the Level 32 conflict. The app will reload and you will start at Level 1." 
                    : "Clear all weekly streak history."}
              </p>
              <div className="flex gap-3">
                 <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold">Cancel</button>
                 <button onClick={() => { if(confirmAction === 'id') onResetLevel(); else onResetStreaks(); setConfirmAction(null); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Wipe Everything</button>
              </div>
           </div>
        </div>
      )}

      <div className="p-8 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-gray-400 text-sm mt-1">Identity Management & Neural Calibration.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          
          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Camera size={18} className="text-brand-primary" /> Profile Identity</h2>
              <div className="flex flex-col items-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-primary/20 bg-black">
                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" style={{ transform: `scale(${userProfile.zoom})` }} />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Codename</label>
                    <input type="text" value={userProfile.name} onChange={(e) => onUpdateProfile({ ...userProfile, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 outline-none" />
                  </div>
                  <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl flex items-center justify-between">
                     <span className="text-brand-primary font-bold uppercase text-xs">{userProfile.gamerTag}</span>
                     <span className="text-[10px] text-white bg-brand-primary/20 px-2 py-0.5 rounded">Lvl {userProfile.level}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.02]">
              <h2 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2"><Database size={18} /> Cloud Sync Repair</h2>
              <div className="space-y-4">
                <div className="bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-[10px] text-gray-600 break-all">
                   CURRENT_DEVICE_ID: {deviceId}
                </div>
                <button 
                  onClick={() => setConfirmAction('id')} 
                  className="w-full py-4 bg-red-500 text-white hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                >
                  Reset Cloud Profile & Local Data
                </button>
                <p className="text-[10px] text-gray-500 italic text-center px-4">
                  * Fixes Level 32 conflict by generating a new unique identity. This action is irreversible.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Palette size={18} className="text-brand-primary" /> Visual Theme</h2>
                <div className="grid grid-cols-2 gap-3">
                   {THEMES.map(theme => (
                      <button key={theme.id} onClick={() => onUpdateAppSettings({ ...appSettings, theme: theme.id })} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${appSettings.theme === theme.id ? 'bg-white/10 border-brand-primary' : 'bg-black/20 border-white/5'}`}>
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.color }}></div>
                         <span className="text-xs font-bold text-white uppercase tracking-tighter">{theme.name}</span>
                      </button>
                   ))}
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Globe size={18} className="text-brand-primary" /> Regional Settings</h2>
                <select value={appSettings.timezone} onChange={(e) => onUpdateAppSettings({ ...appSettings, timezone: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-brand-primary/50 outline-none">
                  {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-dark-950 text-white">{tz}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

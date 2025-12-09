import React, { useRef, useState } from 'react';
import { UserProfile, AppSettings, AppTheme } from '../types';
import { Camera, RefreshCw, ZoomIn, Globe, Clock, Sparkles, Palette, AlertTriangle, Trash2, Award, X, Check, Grid } from 'lucide-react';
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
  "UTC",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney"
];

const THEMES: { id: AppTheme; name: string; color: string }[] = [
  { id: 'neon-lime', name: 'Neon Lime', color: '#CCFF00' },
  { id: 'crimson-red', name: 'Crimson Red', color: '#EF4444' },
  { id: 'cyan-blue', name: 'Cyan Blue', color: '#06B6D4' },
  { id: 'royal-purple', name: 'Royal Purple', color: '#D946EF' },
  { id: 'sunset-orange', name: 'Sunset Orange', color: '#F97316' },
];

const AVATAR_PRESETS = [
  'Prime',
  'Willem',
  'George',
  'Jocelyn',
  'Destiny',
  'Midnight',
  'Cyber',
  'Nexus',
  'Omega',
  'Viper'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  appSettings,
  onUpdateProfile,
  onUpdateAppSettings,
  onResetLevel,
  onResetStreaks
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation State
  const [genPrompt, setGenPrompt] = useState('High quality Batman logo, cinematic lighting, 8k resolution');
  const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Avatar Selection State
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<'level' | 'streak' | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ ...userProfile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: genPrompt }] },
        config: {
          imageConfig: {
            imageSize: genSize,
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || e.toString();
      if (
        errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("permission") || 
        errorMessage.includes("403") ||
        e.status === 403
      ) {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.aistudio) {
             await window.aistudio.openSelectKey();
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedAvatar = () => {
    if (generatedImage) {
      onUpdateProfile({ ...userProfile, avatarUrl: generatedImage, zoom: 1 });
      setGeneratedImage(null);
    }
  };

  const executeConfirmAction = () => {
     if (confirmAction === 'level') {
        onResetLevel();
     } else if (confirmAction === 'streak') {
        onResetStreaks();
     }
     setConfirmAction(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in-up">
      
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-[#0B0E14] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fade-in-up">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 mx-auto">
                 <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
                 {confirmAction === 'level' 
                    ? "This will reset your level to 1 and remove all gathered XP. This action cannot be undone."
                    : "This will wipe your entire streak history. You will start from Day 0. This action cannot be undone."
                 }
              </p>
              <div className="flex gap-3">
                 <button 
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={executeConfirmAction}
                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-900/20"
                 >
                    Confirm Reset
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="p-8 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-gray-400 text-sm mt-1">Customize your HUD identity and preferences.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          
          {/* LEFT COLUMN: Identity */}
          <div className="space-y-8">
            
            {/* Profile Picture Section */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Camera size={18} className="text-brand-primary" />
                Avatar & Identity
              </h2>

              <div className="flex flex-col items-center">
                <div className="relative group mb-6">
                  {/* The Circular Mask */}
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-primary/20 shadow-[0_0_20px_rgba(204,255,0,0.1)] bg-black relative">
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ transform: `scale(${userProfile.zoom})` }}
                    />
                  </div>
                  
                  {/* Upload Overlay */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  >
                    <Camera className="text-white" size={24} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                
                {/* Avatar Presets Toggle */}
                <button 
                   onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                   className="mb-6 text-xs text-brand-primary hover:text-white flex items-center gap-1.5 font-bold uppercase tracking-wide border border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-1.5 rounded-full transition-all"
                >
                   <Grid size={12} /> {showAvatarPresets ? 'Hide Presets' : 'Select Avatar Preset'}
                </button>

                {/* Avatar Presets Grid */}
                {showAvatarPresets && (
                   <div className="w-full grid grid-cols-5 gap-3 mb-6 animate-fade-in bg-black/20 p-4 rounded-xl border border-white/5">
                      {AVATAR_PRESETS.map((seed) => {
                         const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                         return (
                            <button
                               key={seed}
                               onClick={() => onUpdateProfile({ ...userProfile, avatarUrl: url, zoom: 1 })}
                               className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-brand-primary hover:shadow-[0_0_10px_rgba(204,255,0,0.3)] transition-all"
                               title={seed}
                            >
                               <img src={url} alt={seed} className="w-full h-full object-cover" />
                               {userProfile.avatarUrl === url && (
                                  <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center border-2 border-brand-primary">
                                     <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                  </div>
                               )}
                            </button>
                         );
                      })}
                   </div>
                )}

                {/* Name & Rank */}
                <div className="w-full space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Codename (Name)</label>
                    <input 
                      type="text" 
                      value={userProfile.name}
                      onChange={(e) => onUpdateProfile({ ...userProfile, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  {/* Rank Display (Automated) */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                        <Award size={12} /> Current Classification
                     </label>
                     <div className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-3 text-brand-primary font-bold tracking-wide flex items-center justify-between">
                        <span>{userProfile.gamerTag}</span>
                        <span className="text-xs opacity-70 uppercase bg-brand-primary text-black px-2 py-0.5 rounded">Lvl {userProfile.level}</span>
                     </div>
                     <p className="text-[10px] text-gray-500 mt-2">
                        Your rank is automatically updated every 5 levels. Gain XP by completing missions and journal entries.
                     </p>
                  </div>

                  {/* AI Generation Section */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                      <label className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Sparkles size={14} /> 
                          AI Avatar Studio
                      </label>
                      
                      <div className="space-y-3">
                          <textarea
                              value={genPrompt}
                              onChange={(e) => setGenPrompt(e.target.value)}
                              placeholder="Describe your ideal avatar..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary/50 focus:outline-none min-h-[80px] resize-none"
                          />
                          
                          <div className="flex items-center gap-2">
                              <select
                                  value={genSize}
                                  onChange={(e) => setGenSize(e.target.value as any)}
                                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-brand-primary/50 outline-none"
                              >
                                  <option value="1K">1K</option>
                                  <option value="2K">2K</option>
                                  <option value="4K">4K</option>
                              </select>
                              
                              <button
                                  onClick={handleGenerateAvatar}
                                  disabled={isGenerating}
                                  className="flex-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  {isGenerating ? (
                                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                      <Sparkles size={14} />
                                  )}
                                  {isGenerating ? 'Generating...' : 'Generate New'}
                              </button>
                          </div>

                          {generatedImage && (
                              <div className="mt-3 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/20 flex items-center gap-4 animate-fade-in">
                                  <img src={generatedImage} alt="Generated" className="w-14 h-14 rounded-full object-cover border border-brand-primary/30" />
                                  <div className="flex-1">
                                      <p className="text-[10px] text-brand-primary font-bold uppercase mb-1">Generation Complete</p>
                                      <div className="flex gap-2">
                                          <button onClick={applyGeneratedAvatar} className="flex-1 bg-brand-primary text-black text-[10px] font-bold py-1.5 rounded hover:bg-brand-secondary transition-colors">Apply</button>
                                          <button onClick={() => setGeneratedImage(null)} className="flex-1 bg-white/10 text-white text-[10px] font-bold py-1.5 rounded hover:bg-white/20 transition-colors">Discard</button>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone: Resets */}
            <div className="glass-panel p-6 rounded-2xl border border-red-900/30 bg-red-900/5">
               <h2 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  System Resets
               </h2>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-bold text-gray-300">Reset Level & XP</h4>
                        <p className="text-xs text-gray-500">Reboot your agent progression to Level 1.</p>
                     </div>
                     <button 
                        onClick={() => setConfirmAction('level')}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                     >
                        <Trash2 size={12} /> Reset Level
                     </button>
                  </div>
                  
                  <div className="h-px bg-red-500/10"></div>

                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-bold text-gray-300">Reset Streak History</h4>
                        <p className="text-xs text-gray-500">Clear your consistency records and start fresh.</p>
                     </div>
                     <button 
                        onClick={() => setConfirmAction('streak')}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                     >
                        <Trash2 size={12} /> Reset Streaks
                     </button>
                  </div>
               </div>
            </div>

          </div>

          {/* RIGHT COLUMN: System */}
          <div className="space-y-8">
             
             {/* Theme Settings */}
             <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Palette size={18} className="text-brand-primary" />
                   Visual Theme
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                   {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => onUpdateAppSettings({ ...appSettings, theme: theme.id })}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                          ${appSettings.theme === theme.id 
                            ? 'bg-white/10 border-brand-primary ring-1 ring-brand-primary/50' 
                            : 'bg-black/20 border-white/5 hover:bg-white/5'
                          }
                        `}
                      >
                         <div 
                           className="w-6 h-6 rounded-full shadow-lg"
                           style={{ backgroundColor: theme.color }}
                         ></div>
                         <span className={`text-sm font-medium ${appSettings.theme === theme.id ? 'text-white' : 'text-gray-400'}`}>
                           {theme.name}
                         </span>
                      </button>
                   ))}
                </div>
             </div>

             {/* Timezone Settings */}
             <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Globe size={18} className="text-brand-primary" />
                   Regional Settings
                </h2>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Clock size={12} /> Timezone
                  </label>
                  <div className="relative">
                    <select 
                      value={appSettings.timezone}
                      onChange={(e) => onUpdateAppSettings({ ...appSettings, timezone: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-brand-primary/50 focus:outline-none transition-colors"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz} className="bg-dark-900 text-white">{tz}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Used for streak calculations. Tasks completed today in your timezone count for today.
                  </p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <RefreshCw size={18} className="text-brand-primary" />
                HUD Branding
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">App Name</label>
                  <input 
                    type="text" 
                    value={appSettings.appName}
                    onChange={(e) => onUpdateAppSettings({ ...appSettings, appName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subtitle / Description</label>
                  <input 
                    type="text" 
                    value={appSettings.appSubtitle}
                    onChange={(e) => onUpdateAppSettings({ ...appSettings, appSubtitle: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-lime-600 flex items-center justify-center shadow-[0_0_10px_rgba(204,255,0,0.2)]">
                   <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-black" stroke="currentColor" strokeWidth="2.5">
                     <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                   </svg>
                 </div>
                 <div>
                   <h3 className="text-white font-bold leading-none">{appSettings.appName}</h3>
                   <p className="text-xs text-gray-500 font-medium mt-0.5">{appSettings.appSubtitle}</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
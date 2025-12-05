import React, { useRef } from 'react';
import { UserProfile, AppSettings } from '../types';
import { Camera, Save, RefreshCw, ZoomIn } from 'lucide-react';

interface SettingsViewProps {
  userProfile: UserProfile;
  appSettings: AppSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateAppSettings: (settings: AppSettings) => void;
}

const GAMER_TAGS = [
  "Entrepreneur", "Outlaw", "Momentum", "Titan", "Maverick", 
  "Visionary", "Operator", "Architect", "Stoic", "Legend",
  "Savage", "Ronin", "Executive", "Founder", "Beast"
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  appSettings,
  onUpdateProfile,
  onUpdateAppSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
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
                    className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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

                {/* Zoom Control */}
                <div className="w-full max-w-xs mb-8">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Fit</span>
                    <span className="flex items-center gap-1"><ZoomIn size={10} /> Zoom</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={userProfile.zoom}
                    onChange={(e) => onUpdateProfile({ ...userProfile, zoom: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>

                {/* Name Input */}
                <div className="w-full space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Codename (Name)</label>
                    <input 
                      type="text" 
                      value={userProfile.name}
                      onChange={(e) => onUpdateProfile({ ...userProfile, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gamer Tag Selection */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">Class Selection (Tag)</h2>
              <div className="flex flex-wrap gap-2">
                {GAMER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => onUpdateProfile({ ...userProfile, gamerTag: tag })}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all duration-200
                      ${userProfile.gamerTag === tag 
                        ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                        : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: System */}
          <div className="space-y-8">
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

            <div className="p-6 rounded-2xl border border-brand-primary/20 bg-brand-primary/5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                   <Save size={24} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-brand-primary font-bold mb-1">Auto-Save Enabled</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All changes to your profile and HUD configuration are automatically saved to your local terminal (Local Storage).
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
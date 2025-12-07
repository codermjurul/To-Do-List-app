import React, { useRef, useState } from 'react';
import { UserProfile, AppSettings, CustomPlaylist } from '../types';
import { Camera, Save, RefreshCw, ZoomIn, Globe, Clock, Music, Plus, Trash2, Users, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

const AVATAR_LIBRARY = [
  // Robots & Mechs
  "https://api.dicebear.com/7.x/bottts/svg?seed=Glitch",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Apex",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Legend",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nana",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zane",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Omega",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Prime",
  
  // Abstract / Gaming / Sports
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60", // Joystick
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&auto=format&fit=crop&q=60", // Gaming setup
  "https://images.unsplash.com/photo-1614728853913-1e2221eb31a3?w=400&auto=format&fit=crop&q=60", // Neon Mask
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60", // Abstract
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&auto=format&fit=crop&q=60", // Football
  "https://images.unsplash.com/photo-1519861531473-920026393112?w=400&auto=format&fit=crop&q=60", // Basketball
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=60", // Gaming Controller
  
  // Stylized / Emoji
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Spooky",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Mario",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Rock",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Sky",
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  appSettings,
  onUpdateProfile,
  onUpdateAppSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistUri, setNewPlaylistUri] = useState('');

  // AI Generation State
  const [genPrompt, setGenPrompt] = useState('High quality Batman logo, cinematic lighting, 8k resolution');
  const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

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
      // Handle missing key (Entity not found) or permission errors (403)
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

  const handleAddPlaylist = () => {
    if (!newPlaylistName.trim() || !newPlaylistUri.trim()) return;
    
    // Basic validation for Spotify URI
    if (!newPlaylistUri.includes('spotify:')) {
      alert("Please enter a valid Spotify URI (e.g., spotify:playlist:...)");
      return;
    }

    const newPlaylist: CustomPlaylist = {
      id: crypto.randomUUID(),
      name: newPlaylistName,
      uri: newPlaylistUri
    };

    onUpdateAppSettings({
      ...appSettings,
      customPlaylists: [...(appSettings.customPlaylists || []), newPlaylist]
    });

    setNewPlaylistName('');
    setNewPlaylistUri('');
  };

  const handleDeletePlaylist = (id: string) => {
    onUpdateAppSettings({
      ...appSettings,
      customPlaylists: appSettings.customPlaylists.filter(p => p.id !== id)
    });
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

                {/* Name & Avatar Library Input */}
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

                  {/* Avatar Library Grid */}
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                        <Users size={12} /> Quick Select Avatar
                     </label>
                     <div className="grid grid-cols-5 gap-2">
                        {AVATAR_LIBRARY.map((url, index) => (
                           <button
                              key={index}
                              onClick={() => onUpdateProfile({ ...userProfile, avatarUrl: url })}
                              className={`
                                 relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer
                                 ${userProfile.avatarUrl === url 
                                    ? 'border-brand-primary shadow-[0_0_10px_rgba(204,255,0,0.4)] scale-105 z-10' 
                                    : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/20'
                                 }
                              `}
                              title="Select Avatar"
                           >
                              <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                           </button>
                        ))}
                     </div>
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

             {/* Custom Playlists Manager */}
             <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Music size={18} className="text-brand-primary" />
                   Soundtrack Manager
                </h2>
                
                <div className="space-y-4 mb-6">
                   <div className="grid grid-cols-12 gap-2">
                      <input 
                        type="text" 
                        placeholder="Playlist Name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="col-span-5 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-primary/50 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Spotify URI (spotify:playlist:...)"
                        value={newPlaylistUri}
                        onChange={(e) => setNewPlaylistUri(e.target.value)}
                        className="col-span-5 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-primary/50 focus:outline-none"
                      />
                      <button 
                        onClick={handleAddPlaylist}
                        disabled={!newPlaylistName || !newPlaylistUri}
                        className="col-span-2 bg-brand-primary hover:bg-brand-secondary text-black rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-500">
                     Right-click a playlist in Spotify → Share → Copy Spotify URI
                   </p>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                   {appSettings.customPlaylists?.map(playlist => (
                     <div key={playlist.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <Music size={14} className="text-gray-400 shrink-0" />
                           <div className="truncate">
                              <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
                              <p className="text-[10px] text-gray-600 truncate">{playlist.uri}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="text-gray-600 hover:text-red-400 p-1.5 hover:bg-white/10 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                   ))}
                   {(!appSettings.customPlaylists || appSettings.customPlaylists.length === 0) && (
                      <p className="text-center text-xs text-gray-600 py-2 italic">No custom playlists added yet.</p>
                   )}
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
import React, { useState, useEffect, useRef } from 'react';
import { Book, Plus, Image as ImageIcon, Save, Trash2, X, Search, Trophy, Calendar, ZoomIn, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { JournalEntry, UserProfile } from '../types';
import { format } from 'date-fns';

interface JournalViewProps {
  currentUserId: string;
  userProfile: UserProfile;
  onXPGain: (amount: number) => void;
}

const MOODS: { id: JournalEntry['mood']; label: string; icon: string; color: string }[] = [
  { id: 'focus', label: 'Focused', icon: '⚡', color: 'text-brand-primary' },
  { id: 'success', label: 'Victory', icon: '🏆', color: 'text-green-400' },
  { id: 'idea', label: 'Epiphany', icon: '💡', color: 'text-yellow-400' },
  { id: 'neutral', label: 'Neutral', icon: '😐', color: 'text-gray-400' },
  { id: 'failure', label: 'Setback', icon: '💀', color: 'text-red-500' },
];

export const JournalView: React.FC<JournalViewProps> = ({ currentUserId, userProfile, onXPGain }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<JournalEntry['mood']>('neutral');
  const [editImages, setEditImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntries();
  }, [currentUserId]);

  const fetchEntries = async () => {
    setIsLoading(true);
    // Always load local data first to ensure availability
    const saved = localStorage.getItem(`journal_${currentUserId}`);
    if (saved) {
      setEntries(JSON.parse(saved));
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) {
            // Check for table missing error (PGRST205 usually or 42P01)
            // If error, we rely on local storage loaded above
            console.warn("Could not fetch from backend (offline or schema mismatch):", error.message);
        } else if (data) {
            const mapped: JournalEntry[] = data.map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            title: e.title,
            content: e.content,
            images: e.images || [],
            mood: e.mood || 'neutral',
            createdAt: new Date(e.created_at).getTime()
            }));
            // If backend is active, it overrides local (or we could merge, but override is simpler for sync)
            if (mapped.length > 0) {
                setEntries(mapped);
            }
        }
      } catch (e) {
        console.warn("Unexpected backend error, using local data.");
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    localStorage.setItem(`journal_${currentUserId}`, JSON.stringify(entries));
  }, [entries, currentUserId]);

  const xpPercentage = userProfile.nextLevelXP > 0 
    ? Math.min(100, Math.round((userProfile.currentXP / userProfile.nextLevelXP) * 100)) 
    : 0;

  const handleCreateNew = () => {
    setIsEditorOpen(true);
    setIsNewEntry(true);
    setSelectedEntry(null);
    setSaveError(null);
    
    setEditTitle('');
    setEditContent('');
    setEditMood('neutral');
    setEditImages([]);
  };

  const handleEditExisting = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
    setIsNewEntry(false);
    setSaveError(null);
    
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood);
    setEditImages(entry.images || []);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(false);
    setIsNewEntry(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (isSaving || !editTitle.trim()) return;
    setIsSaving(true);
    setSaveError(null);

    try {
        const timestamp = Date.now();
        const idToUse = isNewEntry ? crypto.randomUUID() : selectedEntry?.id;
        if (!isNewEntry && !idToUse) {
             throw new Error("Missing ID for update");
        }

        const finalId = idToUse || crypto.randomUUID();

        const newEntry: JournalEntry = {
            id: finalId,
            userId: currentUserId,
            title: editTitle,
            content: editContent,
            mood: editMood,
            images: [...editImages],
            createdAt: isNewEntry ? timestamp : (selectedEntry?.createdAt || timestamp)
        };

        // Optimistic update
        if (isNewEntry) {
            setEntries(prev => [newEntry, ...prev]);
            onXPGain(150);
        } else {
            setEntries(prev => prev.map(e => e.id === newEntry.id ? newEntry : e));
        }

        setSelectedEntry(newEntry);
        setIsEditorOpen(false);

        if (supabase) {
             const payload = {
                id: newEntry.id,
                user_id: currentUserId,
                title: newEntry.title,
                content: newEntry.content,
                mood: newEntry.mood,
                images: newEntry.images,
             };

             let error;
             try {
                if (isNewEntry) {
                    const { error: insertError } = await supabase.from('journal_entries').insert([{
                        ...payload,
                        created_at: new Date(newEntry.createdAt).toISOString()
                    }]);
                    error = insertError;
                } else {
                    const { error: updateError } = await supabase.from('journal_entries').update(payload).eq('id', newEntry.id);
                    error = updateError;
                }
             } catch(e) {
                 error = e;
             }

             if (error) {
                // We do not setSaveError here to alert the user because the data IS saved locally.
                // We just log it.
                console.warn("Saved to local storage only (Backend Error):", error);
             }
        }
    } catch (e: any) {
        console.error("Save failed", e);
        setSaveError(e.message || "Unknown error occurred while saving.");
    } finally {
        setIsSaving(false);
        setIsNewEntry(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log?")) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setIsEditorOpen(false);
    }
    if (supabase) {
      try {
        await supabase.from('journal_entries').delete().eq('id', id);
      } catch(e) {
        // ignore
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editImages.length >= 2) {
      alert("Maximum of 2 images allowed per entry.");
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please use images under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
            setEditImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEditor = () => (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">{isNewEntry ? 'New Entry' : 'Edit Entry'}</h2>
        <div className="flex items-center gap-2">
          <button 
             onClick={() => {
                 setIsEditorOpen(false);
                 if(isNewEntry) setSelectedEntry(null);
                 setIsNewEntry(false);
                 setSaveError(null);
             }}
             className="px-4 py-2 rounded-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-6 py-2 rounded-full bg-brand-primary text-black text-xs font-bold hover:bg-brand-secondary transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} />
            {isNewEntry ? 'Save Log (+150 XP)' : 'Update Log'}
          </button>
        </div>
      </div>
      
      {saveError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
           <AlertTriangle size={14} />
           <span>{saveError}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Subject</label>
              <input 
                type="text" 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Mission Report Title..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:border-brand-primary/50 focus:outline-none transition-colors placeholder-gray-700"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Status / Mood</label>
              <div className="relative">
                 <select 
                   value={editMood}
                   onChange={e => setEditMood(e.target.value as any)}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-brand-primary/50 outline-none"
                 >
                    {MOODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
                 </select>
              </div>
           </div>
        </div>

        <div>
           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Log Content</label>
           <textarea 
             value={editContent}
             onChange={e => setEditContent(e.target.value)}
             placeholder="Record your observations..."
             className="w-full min-h-[300px] bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-gray-300 leading-relaxed focus:border-brand-primary/50 focus:outline-none transition-colors resize-none placeholder-gray-700"
           />
        </div>

        <div>
           <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Visual Evidence <span className="text-gray-600 normal-case font-normal">(Max 2)</span></label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={editImages.length >= 2}
                className="text-xs text-brand-primary hover:text-white flex items-center gap-1 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <Plus size={12} /> Add Image
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {editImages.map((img, idx) => (
                 <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    <button 
                       onClick={() => removeImage(idx)}
                       className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                       <X size={12} />
                    </button>
                 </div>
              ))}
              {editImages.length < 2 && (
                 <div onClick={() => fileInputRef.current?.click()} className="col-span-full h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-400 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all">
                    <div className="flex flex-col items-center gap-1">
                       <ImageIcon size={20} />
                       <span className="text-xs">Upload visual data</span>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in-up relative">
      
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setPreviewImage(null)}
        >
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10" />
            <div className="absolute top-4 right-4 text-white/50 text-xs">Click to close</div>
        </div>
      )}

      <div className="px-8 pt-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Daily Journal</h1>
          <p className="text-gray-400 text-sm mt-1">Track your journey, reflect on progress, and document victories.</p>
        </div>

        <div className="flex flex-col gap-2 w-64">
           <div className="flex justify-between items-center text-xs font-medium">
              <div className="flex items-center gap-1.5 text-brand-primary">
                <Trophy size={14} />
                <span>Current Level {userProfile.level}</span>
              </div>
              <span className="text-white">{userProfile.currentXP} <span className="text-gray-500">/ {userProfile.nextLevelXP} XP</span></span>
           </div>
           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                 className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out"
                 style={{ width: `${xpPercentage}%` }}
              ></div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
        
        <div className="w-1/3 min-w-[300px] flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden">
           <div className="p-4 border-b border-white/5 space-y-4">
              <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search logs..."
                   className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary/30 placeholder-gray-600"
                 />
              </div>
              <button 
                 onClick={handleCreateNew}
                 className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-brand-primary/10 border border-white/10 hover:border-brand-primary/30 text-white hover:text-brand-primary transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide"
              >
                 <Plus size={16} /> New Entry
              </button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {filteredEntries.length === 0 ? (
                 <div className="text-center py-10 text-gray-600 text-xs italic">
                    {searchQuery ? 'No matching logs found.' : 'No entries recorded.'}
                 </div>
              ) : (
                 filteredEntries.map(entry => (
                    <div 
                      key={entry.id}
                      onClick={() => handleSelectEntry(entry)}
                      className={`
                        group p-4 rounded-xl cursor-pointer transition-all border
                        ${selectedEntry?.id === entry.id && !isNewEntry 
                           ? 'bg-brand-primary/10 border-brand-primary/30' 
                           : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                        }
                      `}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                             {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span title={MOODS.find(m => m.id === entry.mood)?.label} className="text-sm">
                             {MOODS.find(m => m.id === entry.mood)?.icon}
                          </span>
                       </div>
                       <h3 className={`font-bold mb-1 line-clamp-1 ${selectedEntry?.id === entry.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {entry.title}
                       </h3>
                       <p className="text-xs text-gray-500 line-clamp-2">
                          {entry.content || 'No content...'}
                       </p>
                    </div>
                 ))
              )}
           </div>
        </div>

        <div className="flex-1 glass-panel rounded-2xl border border-white/5 p-8 relative overflow-hidden flex flex-col">
           {isEditorOpen ? (
              renderEditor()
           ) : selectedEntry ? (
              <div className="flex flex-col h-full animate-fade-in">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                             <Calendar size={10} />
                             {format(new Date(selectedEntry.createdAt), 'EEEE, MMMM do, yyyy')}
                          </span>
                          <span className={`text-sm ${MOODS.find(m => m.id === selectedEntry.mood)?.color}`}>
                             {MOODS.find(m => m.id === selectedEntry.mood)?.icon} {MOODS.find(m => m.id === selectedEntry.mood)?.label}
                          </span>
                       </div>
                       <h1 className="text-3xl font-bold text-white leading-tight">{selectedEntry.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                          onClick={() => handleEditExisting(selectedEntry)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                       >
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="uppercase">Edit</span>
                          </div>
                       </button>
                       <button 
                          onClick={() => handleDelete(selectedEntry.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <div className="prose prose-invert max-w-none">
                       <p className="text-gray-300 whitespace-pre-line leading-7 text-sm">
                          {selectedEntry.content}
                       </p>
                    </div>

                    {selectedEntry.images && selectedEntry.images.length > 0 && (
                       <div className="mt-8 pt-8 border-t border-white/5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Visual Evidence</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {selectedEntry.images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-brand-primary/50 transition-colors group relative"
                                    onClick={() => setPreviewImage(img)}
                                >
                                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <ZoomIn className="text-white drop-shadow-md" size={24} />
                                   </div>
                                   <img src={img} alt={`Attachment ${idx}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Book size={32} className="text-gray-600" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Mission Log</h2>
                 <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
                    Select an entry from the list to review, or initialize a new record to document your journey.
                 </p>
                 <button 
                    onClick={handleCreateNew}
                    className="px-6 py-3 rounded-xl bg-brand-primary text-black font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all transform hover:-translate-y-1"
                 >
                    Initialize New Entry
                 </button>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}
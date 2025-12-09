

import React, { useState } from 'react';
import { TaskList } from '../types';
import { Calendar, Layers, Edit2, Check, ArrowRight, Plus, Target, Zap, Flag, Bookmark, Layout, Briefcase, Code, Terminal, Hexagon, X } from 'lucide-react';

interface TasksEntryProps {
  taskLists: TaskList[];
  onSelect: (listId: string) => void;
  onUpdateList: (listId: string, name: string, description?: string, icon?: string) => void;
  onCreateList: (name: string, description: string, icon: string) => void;
  listStats: Record<string, { total: number; completed: number }>;
}

const AVAILABLE_ICONS = [
  'calendar', 'layers', 'target', 'zap', 'flag', 'bookmark', 'layout', 'briefcase', 'code', 'terminal', 'hexagon'
];

export const TasksEntry: React.FC<TasksEntryProps> = ({ taskLists, onSelect, onUpdateList, onCreateList, listStats }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editIconPickerOpen, setEditIconPickerOpen] = useState(false);

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('layers');
  const [createIconPickerOpen, setCreateIconPickerOpen] = useState(false);

  const handleStartEdit = (e: React.MouseEvent, list: TaskList) => {
    e.stopPropagation();
    setEditingId(list.id);
    setEditName(list.name);
    setEditDesc(list.description || '');
    setEditIcon(list.icon || 'layers');
    setEditIconPickerOpen(false);
    setIsCreating(false);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.FormEvent, listId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editName.trim()) {
      onUpdateList(listId, editName.trim(), editDesc.trim(), editIcon);
    }
    setEditingId(null);
    setEditIconPickerOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreateList(newName.trim(), newDesc.trim(), newIcon);
      setIsCreating(false);
      setNewName('');
      setNewDesc('');
      setNewIcon('layers');
      setCreateIconPickerOpen(false);
    }
  };

  const getIcon = (iconName?: string, size = 32) => {
    const props = { size, className: "text-brand-primary" };
    switch (iconName) {
      case 'calendar': return <Calendar {...props} />;
      case 'layers': return <Layers {...props} />;
      case 'target': return <Target {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'flag': return <Flag {...props} />;
      case 'bookmark': return <Bookmark {...props} />;
      case 'layout': return <Layout {...props} />;
      case 'briefcase': return <Briefcase {...props} />;
      case 'code': return <Code {...props} />;
      case 'terminal': return <Terminal {...props} />;
      case 'hexagon': return <Hexagon {...props} />;
      default: return <Layers {...props} />;
    }
  };

  const IconPicker: React.FC<{ selected: string, onSelect: (icon: string) => void }> = ({ selected, onSelect }) => (
    <div className="grid grid-cols-6 gap-2 mt-2 p-3 bg-[#151921] rounded-xl border border-white/20 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar relative z-50">
      {AVAILABLE_ICONS.map(icon => (
        <button
          key={icon}
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(icon); }}
          className={`
            p-2 rounded-lg flex items-center justify-center transition-all duration-200 aspect-square
            ${selected === icon 
              ? 'bg-brand-primary text-black shadow-[0_0_10px_rgba(204,255,0,0.4)] transform scale-105' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          {React.cloneElement(getIcon(icon, 18), { 
            className: selected === icon ? 'text-black' : 'text-gray-400' 
          })}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full p-8 overflow-y-auto custom-scrollbar relative animate-fade-in-up">
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
           <p className="text-gray-400 text-sm mt-1">Select a module to view active directives.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl pb-12">
        {taskLists.map((list) => {
          const stats = listStats[list.id] || { total: 0, completed: 0 };
          const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const activeCount = Math.max(0, stats.total - stats.completed);

          return (
            <div 
              key={list.id}
              onClick={() => editingId !== list.id && onSelect(list.id)}
              className={`
                 group relative glass-panel rounded-3xl p-8 transition-all duration-300 overflow-visible
                 ${editingId === list.id ? 'border-brand-primary ring-1 ring-brand-primary/50 bg-black/50 z-20' : 'cursor-pointer hover:border-brand-primary/50 hover:bg-white/[0.03]'}
              `}
            >
              {editingId !== list.id && (
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-brand-primary/10 transition-colors"></div>
              )}
  
              <div className="relative z-10 flex flex-col h-full min-h-[160px] justify-between">
                
                {/* Header: Icon & Edit Button */}
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                     <div 
                        onClick={(e) => {
                          if (editingId === list.id) {
                            e.stopPropagation();
                            setEditIconPickerOpen(!editIconPickerOpen);
                          }
                        }}
                        className={`
                          p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 transition-all duration-300
                          ${editingId !== list.id ? 'group-hover:scale-110' : 'cursor-pointer hover:bg-brand-primary/20 hover:border-brand-primary/40'}
                        `}
                     >
                       {getIcon(editingId === list.id ? editIcon : list.icon)}
                     </div>
                     
                     {/* Icon Picker Popover for Edit Mode */}
                     {editingId === list.id && editIconPickerOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 animate-fade-in-up">
                           <IconPicker selected={editIcon} onSelect={(icon) => { setEditIcon(icon); setEditIconPickerOpen(false); }} />
                        </div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {editingId === list.id ? (
                        <button 
                          onClick={(e) => handleSaveEdit(e, list.id)}
                          className="p-2 bg-brand-primary text-black rounded-full hover:bg-brand-secondary transition-colors shadow-[0_0_15px_rgba(204,255,0,0.4)]"
                        >
                          <Check size={16} />
                        </button>
                     ) : (
                        <button 
                          onClick={(e) => handleStartEdit(e, list)}
                          className="p-2 text-gray-600 hover:text-white hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                     )}
                  </div>
                </div>
  
                {/* Content: Title & Desc */}
                <div className="flex-1 flex flex-col justify-end">
                  {editingId === list.id ? (
                    <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-black/40 border border-brand-primary/50 rounded-lg px-2 py-1 text-2xl font-bold text-white focus:outline-none placeholder-gray-700"
                        placeholder="Mission Name"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-brand-primary/30 resize-none placeholder-gray-700"
                        placeholder="Description (optional)"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white group-hover:text-brand-primary transition-colors">
                        {list.name}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed max-w-[90%] mt-2 mb-4">
                        {list.description}
                      </p>

                      {/* Progress Bar & Stats */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                           <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-white transition-colors">
                              <span className="font-bold text-white">{activeCount}</span>
                              <span className="font-medium">Active</span>
                           </div>
                           <span className={`font-bold ${progressPercent === 100 ? 'text-brand-primary' : 'text-gray-500'}`}>
                             {progressPercent}% Done
                           </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${progressPercent}%` }}
                           ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Create New Card */}
        {isCreating ? (
           <div className="glass-panel rounded-3xl p-8 border border-brand-primary bg-black/50 relative overflow-visible z-20">
              <form onSubmit={handleCreateSubmit} className="flex flex-col h-full min-h-[160px] justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <div className="relative">
                       <div 
                        onClick={() => setCreateIconPickerOpen(!createIconPickerOpen)}
                        className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 cursor-pointer hover:bg-brand-primary/20 hover:border-brand-primary/40 transition-all"
                        title="Click to change icon"
                       >
                          {getIcon(newIcon)}
                       </div>
                       
                       {createIconPickerOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 animate-fade-in-up">
                           <IconPicker selected={newIcon} onSelect={(icon) => { setNewIcon(icon); setCreateIconPickerOpen(false); }} />
                        </div>
                       )}
                    </div>
                    
                    <button 
                      type="submit"
                      className="p-2 bg-brand-primary text-black rounded-full hover:bg-brand-secondary transition-colors shadow-[0_0_15px_rgba(204,255,0,0.4)]"
                    >
                      <Check size={16} />
                    </button>
                 </div>

                 <div className="flex flex-col gap-3">
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-black/40 border border-brand-primary/50 rounded-lg px-3 py-2 text-xl font-bold text-white focus:outline-none placeholder-gray-600"
                      placeholder="Mission Name"
                    />
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-primary/30 resize-none placeholder-gray-600"
                      placeholder="Briefing (Optional)"
                      rows={2}
                    />
                 </div>

                 <button 
                   type="button" 
                   onClick={() => setIsCreating(false)} 
                   className="absolute top-4 right-14 text-xs text-gray-500 hover:text-white"
                   title="Cancel Creation"
                 >
                   <X size={16} />
                 </button>
              </form>
           </div>
        ) : (
           <button 
              onClick={() => setIsCreating(true)}
              className="group relative rounded-3xl p-8 border-2 border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-white/[0.02] flex flex-col items-center justify-center gap-4 transition-all duration-300 min-h-[250px]"
           >
              <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
                 <Plus size={32} className="text-gray-500 group-hover:text-brand-primary transition-colors" />
              </div>
              <div className="text-center">
                 <h3 className="text-lg font-bold text-gray-300 group-hover:text-white">Initialize New Mission</h3>
                 <p className="text-xs text-gray-500 mt-1">Create a new task list module</p>
              </div>
           </button>
        )}

      </div>
    </div>
  );
};
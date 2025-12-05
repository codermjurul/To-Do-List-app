import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MissionLog } from './components/MissionLog';
import { StreaksView } from './components/StreaksView';
import { JournalView } from './components/JournalView';
import { Task, ViewType } from './types';
import { supabase } from './lib/supabase';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('tasks');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (data) {
        // Map database snake_case to frontend camelCase
        const mappedTasks: Task[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          isImportant: t.is_important,
          timestamp: new Date(t.created_at).getTime(),
          category: t.category
        }));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (title: string) => {
    // Optimistic UI update
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      id: tempId,
      title,
      completed: false,
      isImportant: false,
      timestamp: Date.now(),
    };
    setTasks(prev => [tempTask, ...prev]);

    if (!supabase) return;

    // DB Insert
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, completed: false, is_important: false }])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      // Revert if failed (optional, simplified for now)
    } else if (data) {
      // Replace temp task with real DB task (to get the real ID)
      setTasks(prev => prev.map(t => t.id === tempId ? {
        ...t,
        id: data.id,
        timestamp: new Date(data.created_at).getTime()
      } : t));
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = !task.completed;

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: newStatus } : t
    ));

    if (!supabase) return;

    // DB Update
    const { error } = await supabase
      .from('tasks')
      .update({ completed: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      // Revert
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !newStatus } : t
      ));
    }
  };

  const handleToggleImportant = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = !task.isImportant;

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, isImportant: newStatus } : t
    ));

    if (!supabase) return;

    // DB Update
    const { error } = await supabase
      .from('tasks')
      .update({ is_important: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      // Revert
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, isImportant: !newStatus } : t
      ));
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskBackup = tasks.find(t => t.id === id);
    
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));

    if (!supabase) return;

    // DB Delete
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      // Revert
      if (taskBackup) {
        setTasks(prev => [...prev, taskBackup].sort((a, b) => b.timestamp - a.timestamp));
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-100 selection:bg-indigo-500/30 selection:text-white relative">
      {/* Decorative Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Demo Mode Banner */}
      {!supabase && (
        <div className="absolute top-0 left-0 w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs font-medium py-1.5 px-4 text-center z-50 backdrop-blur-md flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          <span>Demo Mode: Connect Supabase in <code>lib/supabase.ts</code> to save data.</span>
        </div>
      )}

      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${!supabase ? 'mt-8' : ''}`}>
        {currentView === 'tasks' && (
          <MissionLog 
            tasks={tasks} 
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            onToggleImportant={handleToggleImportant}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {currentView === 'streaks' && <StreaksView />}
        {currentView === 'journal' && <JournalView />}
      </main>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MissionLog } from './components/MissionLog';
import { StreaksView } from './components/StreaksView';
import { JournalView } from './components/JournalView';
import { SettingsView } from './components/SettingsView';
import { Task, ViewType, TimerState, UserProfile, AppSettings } from './types';
import { supabase } from './lib/supabase';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('tasks');
  const [isLoading, setIsLoading] = useState(true);

  // Global Timer State
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    taskId: null,
    taskTitle: '',
    totalSeconds: 0,
    remainingSeconds: 0
  });

  // User Profile State (Persisted in localStorage for now)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('agency_hud_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Manjarul',
      avatarUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Arthur_Morgan_-_Red_Dead_Redemption_2.png',
      gamerTag: 'OUTLAW',
      level: 32,
      zoom: 1
    };
  });

  // App Settings State (Persisted in localStorage)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agency_hud_settings');
    return saved ? JSON.parse(saved) : {
      appName: 'Quantix',
      appSubtitle: 'Agency HUD'
    };
  });

  const timerRef = useRef<number | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('agency_hud_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('agency_hud_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused && timerState.remainingSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerState(prev => {
          if (prev.remainingSeconds <= 1) {
            // Timer Finished
            if (timerRef.current) clearInterval(timerRef.current);
            // Play alarm sound here if needed
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log(e));
            
            return { ...prev, isActive: false, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerState.isActive, timerState.isPaused]);

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
        const mappedTasks: Task[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          isImportant: t.is_important,
          timestamp: new Date(t.created_at).getTime(),
          category: t.category,
          duration: null 
        }));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (title: string, durationMinutes?: number) => {
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      id: tempId,
      title,
      completed: false,
      isImportant: false,
      timestamp: Date.now(),
      duration: durationMinutes
    };
    setTasks(prev => [tempTask, ...prev]);

    // Start Timer Logic if duration is set
    if (durationMinutes) {
      setTimerState({
        isActive: true,
        isPaused: false,
        taskId: tempId,
        taskTitle: title,
        totalSeconds: durationMinutes * 60,
        remainingSeconds: durationMinutes * 60
      });
    }

    if (!supabase) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, completed: false, is_important: false }])
      .select()
      .single();

    if (!error && data) {
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
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));

    if (!supabase) return;
    await supabase.from('tasks').update({ completed: newStatus }).eq('id', id);
  };

  const handleToggleImportant = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = !task.isImportant;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isImportant: newStatus } : t));

    if (!supabase) return;
    await supabase.from('tasks').update({ is_important: newStatus }).eq('id', id);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!supabase) return;
    await supabase.from('tasks').delete().eq('id', id);
  };

  // Timer Controls passed to Sidebar
  const togglePauseTimer = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const stopTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: false, remainingSeconds: 0 }));
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-100 selection:bg-brand-primary/30 selection:text-white relative">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-lime-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-teal-900/10 rounded-full blur-[100px]"></div>
      </div>

      {!supabase && (
        <div className="absolute top-0 left-0 w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs font-medium py-1.5 px-4 text-center z-50 backdrop-blur-md flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          <span>Demo Mode: Connect Supabase to save data.</span>
        </div>
      )}

      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        timerState={timerState}
        onTogglePauseTimer={togglePauseTimer}
        onStopTimer={stopTimer}
        userProfile={userProfile}
        appSettings={appSettings}
      />
      
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
        {currentView === 'streaks' && <StreaksView tasks={tasks} />}
        {currentView === 'journal' && <JournalView />}
        {currentView === 'settings' && (
          <SettingsView 
            userProfile={userProfile}
            appSettings={appSettings}
            onUpdateProfile={setUserProfile}
            onUpdateAppSettings={setAppSettings}
          />
        )}
      </main>
    </div>
  );
}
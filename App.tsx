
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MissionLog } from './components/MissionLog';
import { TasksEntry } from './components/TasksEntry';
import { StreaksView } from './components/StreaksView';
import { JournalView } from './components/JournalView';
import { SettingsView } from './components/SettingsView';
import { ProgressView } from './components/ProgressView';
import { LevelUpModal } from './components/LevelUpModal';
import { Task, ViewType, TimerState, UserProfile, AppSettings, TaskList, AppTheme, SessionState, TaskPriority, SessionRecord } from './types';
import { supabase } from './lib/supabase';
import { AlertTriangle } from 'lucide-react';
import { calculateTaskXP } from './lib/xpSystem';

const getDeviceId = () => {
  let id = localStorage.getItem('agency_hud_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('agency_hud_device_id', id);
  }
  return id;
};

const RANKS = [
  { level: 1, title: "Initiate" },
  { level: 5, title: "Scout" },
  { level: 10, title: "Operator" },
  { level: 15, title: "Specialist" },
  { level: 20, title: "Elite" },
  { level: 25, title: "Vanguard" },
  { level: 30, title: "Legend" },
  { level: 40, title: "Ascendant" },
  { level: 50, title: "Architect" },
];

const getRank = (level: number) => {
  const rank = [...RANKS].reverse().find(r => level >= r.level);
  return rank ? rank.title : "Initiate";
};

const THEME_COLORS: Record<AppTheme, { primary: string; secondary: string; glow: string; accent: string }> = {
  'neon-lime': { primary: '#CCFF00', secondary: '#A3E635', glow: '#ECFCCB', accent: '#84CC16' },
  'crimson-red': { primary: '#EF4444', secondary: '#F87171', glow: '#FEE2E2', accent: '#DC2626' },
  'cyan-blue': { primary: '#06B6D4', secondary: '#22D3EE', glow: '#CFFAFE', accent: '#0891B2' },
  'royal-purple': { primary: '#D946EF', secondary: '#E879F9', glow: '#FAE8FF', accent: '#C026D3' },
  'sunset-orange': { primary: '#F97316', secondary: '#FB923C', glow: '#FFEDD5', accent: '#EA580C' },
};

export default function App() {
  const deviceId = useMemo(() => getDeviceId(), []);

  // Initialize tasks from LocalStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('agency_hud_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<ViewType>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [taskLists, setTaskLists] = useState<TaskList[]>(() => {
    const saved = localStorage.getItem('agency_hud_lists');
    return saved ? JSON.parse(saved) : [
      { id: 'daily', name: 'Daily Tasks', description: 'Your active missions.', icon: 'calendar' },
      { id: 'tasks_only', name: 'Tasks Only', description: 'General to-do items.', icon: 'layers' }
    ];
  });

  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    taskId: null,
    taskTitle: '',
    totalSeconds: 0,
    remainingSeconds: 0
  });

  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    sessionId: null
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('agency_hud_profile');
    const defaultProfile: UserProfile = {
      name: 'Agent',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Prime',
      gamerTag: 'Initiate',
      level: 1,
      currentXP: 0,
      nextLevelXP: 1000,
      zoom: 1,
      stats: { totalHours: 0, totalTasksCompleted: 0 }
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultProfile, ...parsed }; 
    }
    return defaultProfile;
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agency_hud_settings');
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    return saved ? JSON.parse(saved) : {
      appName: 'Quantix',
      appSubtitle: 'Agency HUD',
      timezone: defaultTimezone,
      theme: 'neon-lime',
      streakStartTimestamp: 0
    };
  });

  const taskTimerRef = useRef<number | null>(null);
  const sessionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const theme = THEME_COLORS[appSettings.theme] || THEME_COLORS['neon-lime'];
    const root = document.documentElement;
    root.style.setProperty('--color-brand-primary', theme.primary);
    root.style.setProperty('--color-brand-secondary', theme.secondary);
    root.style.setProperty('--color-brand-glow', theme.glow);
    root.style.setProperty('--color-brand-accent', theme.accent);
  }, [appSettings.theme]);

  // Persist Lists
  useEffect(() => {
    localStorage.setItem('agency_hud_lists', JSON.stringify(taskLists));
  }, [taskLists]);

  // Persist Tasks
  useEffect(() => {
    localStorage.setItem('agency_hud_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const loadProfileAndStats = async () => {
      if (supabase) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', deviceId)
            .single();

          const { data: sessionData } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', deviceId);
          
          if (sessionData) {
             setSessions(sessionData as SessionRecord[]);
          }

          const totalSeconds = sessionData?.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) || 0;
          const totalHours = totalSeconds / 3600;

          if (profileData) {
            setUserProfile(prev => ({
                ...prev,
                name: profileData.name || prev.name,
                avatarUrl: profileData.avatar_url || prev.avatarUrl,
                gamerTag: getRank(profileData.level),
                level: profileData.level,
                currentXP: profileData.current_xp || prev.currentXP,
                nextLevelXP: profileData.next_level_xp || prev.nextLevelXP,
                zoom: profileData.zoom || prev.zoom,
                stats: {
                  totalHours: totalHours,
                  totalTasksCompleted: profileData.total_tasks_completed || prev.stats?.totalTasksCompleted || 0
                }
            }));
          }
        } catch (err) {
          console.warn("Error loading remote stats, using local:", err);
        }
      }
    };
    loadProfileAndStats();
  }, [deviceId]);

  useEffect(() => {
    localStorage.setItem('agency_hud_profile', JSON.stringify(userProfile));
    
    const saveProfile = async () => {
      if (!supabase) return;
      try {
        await supabase.from('profiles').upsert({
          id: deviceId,
          name: userProfile.name,
          avatar_url: userProfile.avatarUrl,
          gamer_tag: userProfile.gamerTag,
          level: userProfile.level,
          current_xp: userProfile.currentXP,
          next_level_xp: userProfile.nextLevelXP,
          zoom: userProfile.zoom,
          total_tasks_completed: userProfile.stats?.totalTasksCompleted || 0,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Profile sync failed");
      }
    };
    
    const timeoutId = setTimeout(saveProfile, 2000);
    return () => clearTimeout(timeoutId);
  }, [userProfile, deviceId]);

  useEffect(() => {
    localStorage.setItem('agency_hud_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    fetchTasks();
    return () => {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  const handleXPGain = (amount: number) => {
    setUserProfile(prev => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let nextXP = prev.nextLevelXP;

      if (newXP >= nextXP) {
        newLevel++;
        newXP = newXP - nextXP;
        nextXP = Math.floor(nextXP * 1.5);
        setShowLevelUpModal(true);
      }

      return {
        ...prev,
        level: newLevel,
        currentXP: newXP,
        nextLevelXP: nextXP
      };
    });
  };

  const handleXPLoss = (amount: number) => {
    setUserProfile(prev => ({
      ...prev,
      currentXP: Math.max(0, prev.currentXP - amount)
    }));
  };

  const handleResetLevel = () => {
     setUserProfile(prev => ({
        ...prev,
        level: 1,
        currentXP: 0,
        nextLevelXP: 1000
     }));
  };

  const handleResetStreaks = () => {
     setAppSettings(prev => ({
        ...prev,
        streakStartTimestamp: Date.now()
     }));
  };

  useEffect(() => {
    if (sessionState.isActive && !sessionState.isPaused) {
      sessionTimerRef.current = window.setInterval(() => {
        setSessionState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [sessionState.isActive, sessionState.isPaused]);

  const handleStartSession = async () => {
    const startTime = Date.now();
    const newSessionId = crypto.randomUUID();

    setSessionState({
      isActive: true,
      isPaused: false,
      startTime,
      elapsedSeconds: 0,
      sessionId: newSessionId
    });

    if (supabase) {
      try {
        await supabase.from('sessions').insert([{
          id: newSessionId,
          user_id: deviceId,
          started_at: new Date(startTime).toISOString(),
        }]);
      } catch (e) {
        console.warn("Session logging disabled (backend error)");
      }
    }
  };

  const handlePauseSession = () => {
    setSessionState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopSession = async () => {
    const duration = sessionState.elapsedSeconds;
    
    const newSessionRecord: SessionRecord = {
       id: sessionState.sessionId || crypto.randomUUID(),
       user_id: deviceId,
       started_at: new Date(sessionState.startTime || Date.now()).toISOString(),
       ended_at: new Date().toISOString(),
       duration_seconds: duration
    };
    setSessions(prev => [...prev, newSessionRecord]);

    if (supabase && sessionState.sessionId) {
      try {
        await supabase.from('sessions').update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration
        }).eq('id', sessionState.sessionId);
      } catch(e) {
        console.warn("Stop session backend fail");
      }
      
      const newTotalSeconds = (userProfile.stats?.totalHours || 0) * 3600 + duration;
      setUserProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats!,
          totalHours: newTotalSeconds / 3600
        }
      }));
    }

    setSessionState({
      isActive: false,
      isPaused: false,
      sessionId: null,
      elapsedSeconds: 0,
      startTime: null
    });
  };

  const fetchTasks = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', deviceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Backend sync issue (Tasks):", error.message);
      } else if (data) {
        const mappedTasks: Task[] = data.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          title: t.title,
          completed: t.completed,
          priority: t.priority || 'Medium',
          xpWorth: t.xp_worth || 10,
          timestamp: new Date(t.created_at).getTime(),
          completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
          duration: t.duration_minutes || null,
          listId: t.list_id || 'daily'
        }));
        
        if (mappedTasks.length > 0) {
            setTasks(mappedTasks);
        }
      }
    } catch (err) {
      console.warn('Network error fetching tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (title: string, durationMinutes: number = 20, priority: TaskPriority = 'Medium', listId: string = 'daily') => {
    const tempId = crypto.randomUUID();
    const calculatedXP = calculateTaskXP(durationMinutes, priority);
    
    const tempTask: Task = {
      id: tempId,
      userId: deviceId,
      title,
      completed: false,
      priority: priority,
      xpWorth: calculatedXP,
      timestamp: Date.now(),
      duration: durationMinutes,
      listId: listId
    };
    
    setTasks(prev => [tempTask, ...prev]);

    if (!supabase) return;

    try {
        const payload: any = { 
            id: tempId,
            user_id: deviceId,
            list_id: listId,
            title, 
            completed: false, 
            priority: priority,
            xp_worth: calculatedXP,
            duration_minutes: durationMinutes
        };
        
        const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();

        if (error) {
            console.warn("Backend save fail:", error.message);
        } else if (data) {
            setTasks(prev => prev.map(t => t.id === tempId ? {
                ...t,
                id: data.id,
                timestamp: new Date(data.created_at).getTime()
            } : t));
        }
    } catch (e) {
        console.warn("Backend error", e);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = !task.completed;
    const completedAt = newStatus ? Date.now() : undefined;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus, completedAt } : t));

    if (newStatus) {
       handleXPGain(task.xpWorth || 10);
       setUserProfile(prev => ({
         ...prev,
         stats: {
           ...prev.stats!,
           totalTasksCompleted: (prev.stats?.totalTasksCompleted || 0) + 1
         }
       }));
    } else {
        handleXPLoss(task.xpWorth || 10);
        setUserProfile(prev => ({
         ...prev,
         stats: {
           ...prev.stats!,
           totalTasksCompleted: Math.max(0, (prev.stats?.totalTasksCompleted || 0) - 1)
         }
       }));
    }

    if (!supabase) return;
    
    try {
        const updatePayload: any = { completed: newStatus };
        if (newStatus) updatePayload.completed_at = new Date().toISOString();
        else updatePayload.completed_at = null;
        
        await supabase.from('tasks').update(updatePayload).eq('id', id);
    } catch(e) {
        console.warn("Backend update fail");
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!supabase) return;
    try {
        await supabase.from('tasks').delete().eq('id', id);
    } catch(e) {
        console.warn("Delete backend fail");
    }
  };

  const handleUpdateList = (id: string, newName: string, newDesc?: string, newIcon?: string) => {
    setTaskLists(prev => prev.map(l => l.id === id ? { 
      ...l, 
      name: newName,
      description: newDesc !== undefined ? newDesc : l.description,
      icon: newIcon !== undefined ? newIcon : l.icon
    } : l));
  };

  const handleCreateList = (name: string, description: string, icon: string) => {
    const newList: TaskList = {
      id: crypto.randomUUID(),
      name,
      description,
      icon
    };
    setTaskLists(prev => [...prev, newList]);
  };

  // Logic: Calculate list stats based on "Daily Reset" for the 'daily' list
  const listStats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayTs = today.getTime();

    return tasks.reduce((acc, t) => {
      const listId = t.listId || 'daily';
      if (!acc[listId]) {
        acc[listId] = { total: 0, completed: 0 };
      }
      
      const isDailyList = listId === 'daily' || listId.includes('daily');
      const taskDate = new Date(t.timestamp);
      taskDate.setHours(0,0,0,0);
      const isTaskFromToday = taskDate.getTime() === todayTs;

      if (isDailyList) {
        // Only count if created today
        if (isTaskFromToday) {
            acc[listId].total++;
            if (t.completed) acc[listId].completed++;
        }
      } else {
        // Standard behavior for other lists
        acc[listId].total++;
        if (t.completed) acc[listId].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
  }, [tasks]);

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-100 selection:bg-brand-primary/30 selection:text-white relative">
      {showLevelUpModal && (
        <LevelUpModal 
          newLevel={userProfile.level} 
          onClose={() => setShowLevelUpModal(false)} 
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-white/[0.02] rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/[0.05] rounded-full blur-[100px]"></div>
      </div>

      {!supabase && (
        <div className="absolute top-0 left-0 w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs font-medium py-1.5 px-4 text-center z-50 backdrop-blur-md flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          <span>Demo Mode: Connect Supabase to save data.</span>
        </div>
      )}

      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          if (view !== 'tasks') {
            setActiveListId(null);
          }
        }}
        userProfile={userProfile}
        appSettings={appSettings}
        sessionState={sessionState}
        onStartSession={handleStartSession}
        onPauseSession={handlePauseSession}
        onStopSession={handleStopSession}
      />
      
      <main className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${!supabase ? 'mt-8' : ''}`}>
        {currentView === 'tasks' && (
          !activeListId ? (
            <TasksEntry 
              taskLists={taskLists}
              onSelect={setActiveListId}
              onUpdateList={handleUpdateList}
              onCreateList={handleCreateList}
              listStats={listStats}
            />
          ) : (
            <MissionLog 
              tasks={tasks.filter(t => (t.listId || 'daily') === activeListId)} 
              timerState={timerState}
              onAddTask={(t, d, p) => handleAddTask(t, d, p, activeListId)}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              listId={activeListId}
              listName={taskLists.find(l => l.id === activeListId)?.name || 'Active Missions'}
              onBack={() => setActiveListId(null)}
              userProfile={userProfile}
            />
          )
        )}

        {currentView === 'progress' && <ProgressView tasks={tasks} />}
        {currentView === 'streaks' && (
          <StreaksView 
            tasks={tasks} 
            timezone={appSettings.timezone} 
            sessions={sessions}
            streakStartTimestamp={appSettings.streakStartTimestamp}
          />
        )}
        {currentView === 'journal' && (
          <JournalView 
            currentUserId={deviceId} 
            userProfile={userProfile}
            onXPGain={handleXPGain}
          />
        )}
        {currentView === 'settings' && (
          <SettingsView 
            userProfile={userProfile}
            appSettings={appSettings}
            onUpdateProfile={setUserProfile}
            onUpdateAppSettings={setAppSettings}
            onResetLevel={handleResetLevel}
            onResetStreaks={handleResetStreaks}
          />
        )}
      </main>
    </div>
  );
}

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

// Helper to get or create a stable ID for this device/browser for simple persistence without auth
const getDeviceId = () => {
  let id = localStorage.getItem('agency_hud_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('agency_hud_device_id', id);
  }
  return id;
};

// Rank Definitions
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
  // Find the highest rank that is less than or equal to current level
  const rank = [...RANKS].reverse().find(r => level >= r.level);
  return rank ? rank.title : "Initiate";
};

// Theme Color Maps
const THEME_COLORS: Record<AppTheme, { primary: string; secondary: string; glow: string; accent: string }> = {
  'neon-lime': { primary: '#CCFF00', secondary: '#A3E635', glow: '#ECFCCB', accent: '#84CC16' },
  'crimson-red': { primary: '#EF4444', secondary: '#F87171', glow: '#FEE2E2', accent: '#DC2626' },
  'cyan-blue': { primary: '#06B6D4', secondary: '#22D3EE', glow: '#CFFAFE', accent: '#0891B2' },
  'royal-purple': { primary: '#D946EF', secondary: '#E879F9', glow: '#FAE8FF', accent: '#C026D3' },
  'sunset-orange': { primary: '#F97316', secondary: '#FB923C', glow: '#FFEDD5', accent: '#EA580C' },
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  // New State for Task Lists
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [taskLists, setTaskLists] = useState<TaskList[]>(() => {
    const saved = localStorage.getItem('agency_hud_lists');
    return saved ? JSON.parse(saved) : [
      { id: 'daily', name: 'Daily Tasks', description: 'Your active missions.', icon: 'calendar' },
      { id: 'tasks_only', name: 'Tasks Only', description: 'General to-do items.', icon: 'layers' }
    ];
  });

  // Task Specific Timer State
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    taskId: null,
    taskTitle: '',
    totalSeconds: 0,
    remainingSeconds: 0
  });

  // Global Session State
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    sessionId: null
  });

  // User Profile State (Persisted in localStorage for now)
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

  // App Settings State (Persisted in localStorage)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agency_hud_settings');
    // Try to guess default timezone
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

  // Apply Theme
  useEffect(() => {
    const theme = THEME_COLORS[appSettings.theme] || THEME_COLORS['neon-lime'];
    const root = document.documentElement;
    root.style.setProperty('--color-brand-primary', theme.primary);
    root.style.setProperty('--color-brand-secondary', theme.secondary);
    root.style.setProperty('--color-brand-glow', theme.glow);
    root.style.setProperty('--color-brand-accent', theme.accent);
  }, [appSettings.theme]);

  // Save Lists
  useEffect(() => {
    localStorage.setItem('agency_hud_lists', JSON.stringify(taskLists));
  }, [taskLists]);

  // Update Rank based on Level
  useEffect(() => {
    const currentRank = getRank(userProfile.level);
    if (userProfile.gamerTag !== currentRank) {
      setUserProfile(prev => ({ ...prev, gamerTag: currentRank }));
    }
  }, [userProfile.level]);

  // Load Profile and Stats from Supabase on mount
  useEffect(() => {
    const loadProfileAndStats = async () => {
      // 1. Fetch Stats if Supabase is connected
      if (supabase) {
        try {
          const deviceId = getDeviceId();
          
          // Get Profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', deviceId)
            .single();

          // Get Task Count
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('completed', true);

          // Get Session Hours
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('*');
          
          if (sessionData) {
            // @ts-ignore
             setSessions(sessionData);
          }

          const totalSeconds = sessionData?.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) || 0;
          const totalHours = totalSeconds / 3600;

          setUserProfile(prev => ({
              ...prev,
              ...(profileData ? {
                name: profileData.name,
                avatarUrl: profileData.avatar_url,
                gamerTag: getRank(profileData.level), // Enforce rank calc
                level: profileData.level,
                currentXP: profileData.current_xp || prev.currentXP,
                nextLevelXP: profileData.next_level_xp || prev.nextLevelXP,
                zoom: profileData.zoom
              } : {}),
              stats: {
                totalHours: totalHours,
                totalTasksCompleted: taskCount || 0
              }
          }));

        } catch (err) {
          console.warn("Error loading stats:", err);
        }
      }
    };
    loadProfileAndStats();
  }, []);

  // Save Profile to Supabase on change
  useEffect(() => {
    localStorage.setItem('agency_hud_profile', JSON.stringify(userProfile));
    
    const saveProfile = async () => {
      if (!supabase) return;
      const deviceId = getDeviceId();
      
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
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Could not save profile to backend:", err);
      }
    };
    
    const timeoutId = setTimeout(saveProfile, 1000);
    return () => clearTimeout(timeoutId);
    
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('agency_hud_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
    return () => {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // --- XP & LEVEL SYSTEM ---
  const handleXPGain = (amount: number) => {
    setUserProfile(prev => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let nextXP = prev.nextLevelXP;

      // Level Up Logic
      if (newXP >= nextXP) {
        newLevel++;
        newXP = newXP - nextXP; // Carry over excess XP
        nextXP = Math.floor(nextXP * 1.5); // Increase difficulty by 50%
        setShowLevelUpModal(true);
        
        // Play Level Up Sound (Optional)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(e => console.log(e));
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
    // Only reduce XP if checkbox is unchecked. Do not de-level for now to avoid complexity/frustration.
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

  // --- GLOBAL SESSION LOGIC ---
  useEffect(() => {
    if (sessionState.isActive && !sessionState.isPaused) {
      sessionTimerRef.current = window.setInterval(() => {
        setSessionState(prev => {
          const newElapsed = prev.elapsedSeconds + 1;
          
          // Passive XP Gain: Every 15 minutes (900 seconds)
          if (newElapsed > 0 && newElapsed % 900 === 0) {
             handleXPGain(10); // +10 XP for staying in flow
             // Tiny sound cue
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
             audio.volume = 0.2;
             audio.play().catch(e => console.log(e));
          }

          return { ...prev, elapsedSeconds: newElapsed };
        });
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
      const deviceId = getDeviceId();
      await supabase.from('sessions').insert([{
        id: newSessionId,
        user_id: deviceId,
        started_at: new Date().toISOString(),
      }]);
    }
  };

  const handlePauseSession = () => {
    setSessionState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopSession = async () => {
    const duration = sessionState.elapsedSeconds;
    
    // Optimistic Session Record for Streaks View
    const newSessionRecord: SessionRecord = {
       id: sessionState.sessionId || crypto.randomUUID(),
       user_id: getDeviceId(),
       started_at: new Date(sessionState.startTime || Date.now()).toISOString(),
       ended_at: new Date().toISOString(),
       duration_seconds: duration
    };
    setSessions(prev => [...prev, newSessionRecord]);

    if (supabase && sessionState.sessionId) {
      await supabase.from('sessions').update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration
      }).eq('id', sessionState.sessionId);
      
      // Update local stats immediately
      const newTotalSeconds = (userProfile.stats?.totalHours || 0) * 3600 + duration;
      setUserProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats!,
          totalHours: newTotalSeconds / 3600
        }
      }));
    }

    setSessionState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      sessionId: null,
      elapsedSeconds: 0
    }));
  };


  // --- TASK TIMER LOGIC ---
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused && timerState.remainingSeconds > 0) {
      taskTimerRef.current = window.setInterval(() => {
        setTimerState(prev => {
          if (prev.remainingSeconds <= 1) {
            if (taskTimerRef.current) clearInterval(taskTimerRef.current);
            // Play alarm
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log(e));
            return { ...prev, isActive: false, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
    }
    return () => {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
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
          priority: t.priority || 'Medium',
          xpWorth: t.xp_worth || 10,
          timestamp: new Date(t.created_at).getTime(),
          completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
          category: t.category,
          duration: t.duration_minutes || null,
          listId: t.list_id || 'daily'
        }));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (title: string, durationMinutes: number = 20, priority: TaskPriority = 'Medium', listId: string = 'daily') => {
    const tempId = crypto.randomUUID();
    const calculatedXP = calculateTaskXP(durationMinutes, priority);
    
    const tempTask: Task = {
      id: tempId,
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

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title, 
        completed: false, 
        priority: priority,
        xp_worth: calculatedXP,
        list_id: listId,
        duration_minutes: durationMinutes
      }])
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
    const completedAt = newStatus ? Date.now() : undefined;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus, completedAt } : t));

    // Update stats & XP
    if (newStatus) {
       // Task Completed
       handleXPGain(task.xpWorth || 10);
       setUserProfile(prev => ({
         ...prev,
         stats: {
           ...prev.stats!,
           totalTasksCompleted: (prev.stats?.totalTasksCompleted || 0) + 1
         }
       }));
    } else {
        // Task Uncompleted (Undo)
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
    const updatePayload: any = { completed: newStatus };
    // Try to update completed_at if the column exists in the backend
    if (newStatus) updatePayload.completed_at = new Date().toISOString();
    else updatePayload.completed_at = null;
    
    await supabase.from('tasks').update(updatePayload).eq('id', id);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!supabase) return;
    await supabase.from('tasks').delete().eq('id', id);
  };

  // Task Timer Controls
  const handleStartTaskTimer = (taskId: string, minutes: number) => {
     const task = tasks.find(t => t.id === taskId);
     setTimerState({
        isActive: true,
        isPaused: false,
        taskId,
        taskTitle: task?.title || '',
        totalSeconds: minutes * 60,
        remainingSeconds: minutes * 60
     });
  };

  const handlePauseTaskTimer = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopTaskTimer = () => {
     setTimerState(prev => ({ ...prev, isActive: false, remainingSeconds: 0, taskId: null }));
  };

  // List Management
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

  // Derived state for Task Entry stats (Total & Completed)
  // UPDATED: Logic to only count tasks completed TODAY or tasks created TODAY for stats.
  // This solves the issue of empty lists with old completed tasks showing "100%".
  const listStats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayTs = today.getTime();

    return tasks.reduce((acc, t) => {
      const listId = t.listId || 'daily';
      if (!acc[listId]) {
        acc[listId] = { total: 0, completed: 0 };
      }
      
      if (!t.completed) {
        // Active tasks always count towards the dashboard view
        acc[listId].total++;
      } else {
        // Completed tasks only count if they were completed TODAY,
        // or if they were created TODAY (fallback if completedAt is missing).
        // If a task is old and completed, it shouldn't show up in the "Today's Mission" progress.
        const cTime = t.completedAt || t.timestamp;
        if (cTime >= todayTs) {
          acc[listId].total++;
          acc[listId].completed++;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
  }, [tasks]);

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-100 selection:bg-brand-primary/30 selection:text-white relative">
      {/* Level Up Overlay */}
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
        
        {/* TASKS VIEW LOGIC */}
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
              listName={taskLists.find(l => l.id === activeListId)?.name || 'Active Missions'}
              onBack={() => setActiveListId(null)}
              // Timer controls removed from view but passed for type compat or refactor needed
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
            currentUserId={getDeviceId()} 
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
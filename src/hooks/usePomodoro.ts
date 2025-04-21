'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { PomodoroSession } from '@/types';
import { useTaskStore } from './useTasks';

// Sound effects
const TIMER_END_SOUND = '/timer-end.mp3'; // You'll need to add this audio file to the public folder
const BREAK_END_SOUND = '/break-end.mp3'; // You'll need to add this audio file to the public folder

// Global interval reference to ensure only one timer is running across components
let globalIntervalRef: NodeJS.Timeout | null = null;
let globalLastTickTimeRef: number = 0;
let globalTickPendingRef: boolean = false;
let activeTimerCount = 0;

interface PomodoroTimerState {
  isActive: boolean;
  isPaused: boolean;
  mode: 'work' | 'break';
  timeRemaining: number;
  duration: number;
  breakDuration: number;
  currentSession: PomodoroSession | null;
  sessions: PomodoroSession[];
  linkedTaskId: string | null;
  shouldUseNotifications: boolean;
  shouldPlaySounds: boolean;
  
  startSession: (userId: string, taskId?: string, duration?: number, breakDuration?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: (completed: boolean) => void;
  resetTimer: () => void;
  setDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  setLinkedTaskId: (taskId: string | null) => void;
  toggleNotifications: () => void;
  toggleSounds: () => void;
  tick: () => void;
  getSessionsByUserId: (userId: string) => PomodoroSession[];
  getSessionsByTaskId: (taskId: string) => PomodoroSession[];
}

export const usePomodoroStore = create<PomodoroTimerState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isPaused: false,
      mode: 'work',
      timeRemaining: 25 * 60, // Default: 25 minutes in seconds
      duration: 25 * 60, // Default work duration: 25 minutes in seconds
      breakDuration: 5 * 60, // Default break duration: 5 minutes in seconds
      currentSession: null,
      sessions: [],
      linkedTaskId: null,
      shouldUseNotifications: true,
      shouldPlaySounds: true,
      
      startSession: (userId, taskId, duration, breakDuration) => {
        // Use provided durations or defaults from the store
        const workDuration = duration ? duration * 60 : get().duration;
        const restDuration = breakDuration ? breakDuration * 60 : get().breakDuration;
        const taskToLink = taskId || get().linkedTaskId;
        
        const now = new Date();
        const endTime = new Date(now.getTime() + workDuration * 1000);
        
        const newSession: PomodoroSession = {
          id: uuidv4(),
          userId,
          taskId: taskToLink || undefined,
          startedAt: now.toISOString(),
          scheduledEndAt: endTime.toISOString(),
          status: 'in_progress',
          interruptions: 0,
        };
        
        set({
          isActive: true,
          isPaused: false,
          mode: 'work',
          timeRemaining: workDuration,
          duration: workDuration,
          breakDuration: restDuration,
          currentSession: newSession,
          sessions: [...get().sessions, newSession],
        });
      },
      
      pauseSession: () => {
        if (!get().isActive || get().isPaused) return;
        
        set((state) => {
          const updatedSession = state.currentSession
            ? {
                ...state.currentSession,
                interruptions: state.currentSession.interruptions + 1,
              }
            : null;
            
          const updatedSessions = state.sessions.map((session) =>
            session.id === updatedSession?.id ? updatedSession : session
          );
          
          return {
            isPaused: true,
            currentSession: updatedSession,
            sessions: updatedSessions,
          };
        });
      },
      
      resumeSession: () => {
        if (!get().isActive || !get().isPaused) return;
        set({ isPaused: false });
      },
      
      stopSession: (completed) => {
        const { currentSession, sessions, mode, shouldUseNotifications, shouldPlaySounds } = get();
        
        if (!currentSession) return;
        
        const endedSession: PomodoroSession = {
          ...currentSession,
          actualEndAt: new Date().toISOString(),
          status: completed ? 'completed' : 'abandoned',
        };
        
        // Update the task's pomodoro count if there's a taskId
        if (currentSession.taskId) {
          useTaskStore.getState().updateTaskPomodoros(currentSession.taskId, completed);
        }
        
        const updatedSessions = sessions.map((session) =>
          session.id === endedSession.id ? endedSession : session
        );
        
        set({
          isActive: false,
          isPaused: false,
          currentSession: null,
          sessions: updatedSessions,
        });
        
        // If completed and in work mode, start break timer
        if (completed && mode === 'work') {
          // Show notification for completed work session
          if (shouldUseNotifications) {
            try {
              new Notification('Pomodoro Completed', {
                body: 'Great job! Time for a break.',
                icon: '/favicon.ico'
              });
            } catch (_) {
              console.log('Notification permission not granted');
            }
          }
          
          // Play work session end sound
          if (shouldPlaySounds) {
            const audio = new Audio(TIMER_END_SOUND);
            audio.play().catch(() => console.log('Failed to play work session end sound'));
          }
          
          set({
            isActive: true,
            mode: 'break',
            timeRemaining: get().breakDuration,
          });
        } else if (completed && mode === 'break') {
          // If break is over, reset timer
          
          // Show notification for completed break
          if (shouldUseNotifications) {
            try {
              new Notification('Break Completed', {
                body: 'Break time is over. Ready for another focus session?',
                icon: '/favicon.ico'
              });
            } catch (_) {
              console.log('Notification permission not granted');
            }
          }
          
          // Play break end sound
          if (shouldPlaySounds) {
            const audio = new Audio(BREAK_END_SOUND);
            audio.play().catch(() => console.log('Failed to play break end sound'));
          }
          
          set({
            mode: 'work',
            timeRemaining: get().duration,
          });
        }
      },
      
      resetTimer: () => {
        set({
          isActive: false,
          isPaused: false,
          mode: 'work',
          timeRemaining: get().duration,
          currentSession: null,
        });
      },
      
      setDuration: (minutes) => {
        const seconds = minutes * 60;
        set({ 
          duration: seconds,
          timeRemaining: get().isActive && get().mode === 'work' ? get().timeRemaining : seconds
        });
      },
      
      setBreakDuration: (minutes) => {
        const seconds = minutes * 60;
        set({ 
          breakDuration: seconds,
          timeRemaining: get().isActive && get().mode === 'break' ? get().timeRemaining : get().timeRemaining
        });
      },
      
      setLinkedTaskId: (taskId) => {
        set({ linkedTaskId: taskId });
      },
      
      toggleNotifications: () => {
        const currentValue = get().shouldUseNotifications;
        
        // Request permission if enabling and not yet granted
        if (!currentValue) {
          if (Notification.permission !== 'granted') {
            Notification.requestPermission();
          }
        }
        
        set({ shouldUseNotifications: !currentValue });
      },
      
      toggleSounds: () => {
        set({ shouldPlaySounds: !get().shouldPlaySounds });
      },
      
      tick: () => {
        const { isActive, isPaused, timeRemaining, mode, shouldPlaySounds, shouldUseNotifications } = get();
        
        if (!isActive || isPaused || timeRemaining <= 0) return;
        
        if (timeRemaining === 1) {
          // Time is up
          const completed = true;
          set({ timeRemaining: 0 });
          
          // Play appropriate sound based on the mode
          if (shouldPlaySounds) {
            const soundFile = mode === 'work' ? TIMER_END_SOUND : BREAK_END_SOUND;
            const audio = new Audio(soundFile);
            audio.play().catch(() => console.log('Failed to play sound'));
          }
          
          // Show browser notification
          if (shouldUseNotifications) {
            try {
              if (mode === 'work') {
                new Notification('Pomodoro Completed', {
                  body: 'Great job! Time for a break.',
                  icon: '/favicon.ico'
                });
              } else {
                new Notification('Break Completed', {
                  body: 'Break time is over. Ready for another focus session?',
                  icon: '/favicon.ico'
                });
              }
            } catch (_) {
              console.log('Notification permission not granted');
            }
          }
          
          if (mode === 'work') {
            get().stopSession(completed);
          } else {
            // Break is over
            set({
              isActive: false,
              mode: 'work',
              timeRemaining: get().duration,
            });
          }
        } else {
          // Just tick the timer down
          set({ timeRemaining: timeRemaining - 1 });
        }
      },
      
      getSessionsByUserId: (userId) => {
        return get().sessions.filter((session) => session.userId === userId);
      },
      
      getSessionsByTaskId: (taskId) => {
        return get().sessions.filter((session) => session.taskId === taskId);
      },
    }),
    {
      name: 'trollr-pomodoro-storage',
      onRehydrateStorage: () => (state) => {
        // Ensure timer is not active when rehydrating state
        if (state) {
          state.isActive = false;
          state.isPaused = false;
        }
      }
    }
  )
);

// Hook to use the pomodoro timer with automatic ticking
export function usePomodoro() {
  const pomodoroStore = usePomodoroStore();
  
  // Request notification permission
  useEffect(() => {
    if (pomodoroStore.shouldUseNotifications && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [pomodoroStore.shouldUseNotifications]);
  
  // Set up the timer interval with precise timing correction
  useEffect(() => {
    // Track active timer instances
    activeTimerCount++;
    
    const store = pomodoroStore;
    
    if (store.isActive && !store.isPaused) {
      // Only set up the interval if it doesn't exist already
      if (!globalIntervalRef) {
        // Initialize timing references
        const now = Date.now();
        globalLastTickTimeRef = now;
        globalTickPendingRef = false;
        
        // Create a new interval that ticks exactly once per second
        globalIntervalRef = setInterval(() => {
          const now = Date.now();
          const elapsed = now - globalLastTickTimeRef;
          
          // Only tick if at least 1000ms has passed AND there's no pending tick
          if (elapsed >= 1000 && !globalTickPendingRef) {
            // Set pending flag to prevent multiple ticks
            globalTickPendingRef = true;
            
            // Execute tick and update references
            store.tick();
            globalLastTickTimeRef = now;
            
            // Reset pending flag after a small delay
            // This ensures we never tick twice in a single interval
            setTimeout(() => {
              globalTickPendingRef = false;
            }, 50);
          }
        }, 100); // Check more frequently (every 100ms) for smoother timing
      }
    } else if (globalIntervalRef && activeTimerCount <= 1) {
      // Only clear the interval if this is the last active timer
      clearInterval(globalIntervalRef);
      globalIntervalRef = null;
    }
    
    return () => {
      // Decrement the counter when a timer instance unmounts
      activeTimerCount--;
      
      // Only clear the interval if this is the last active timer
      if (activeTimerCount <= 0 && globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
        activeTimerCount = 0; // Reset to ensure no negative values
      }
    };
  }, [pomodoroStore, pomodoroStore.isActive, pomodoroStore.isPaused]);
  
  // Format time remaining as mm:ss
  const formattedTimeRemaining = () => {
    const minutes = Math.floor(pomodoroStore.timeRemaining / 60);
    const seconds = pomodoroStore.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress as a percentage
  const progress = () => {
    const total = pomodoroStore.mode === 'work' ? pomodoroStore.duration : pomodoroStore.breakDuration;
    return ((total - pomodoroStore.timeRemaining) / total) * 100;
  };
  
  return {
    ...pomodoroStore,
    formattedTimeRemaining,
    progress,
  };
}
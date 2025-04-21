import { renderHook, act } from '@testing-library/react';
import { usePomodoroStore } from '@/hooks/usePomodoro';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('Pomodoro State Persistence', () => {
  const mockStorage: Record<string, string> = {};

  // Mock localStorage
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockStorage[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockStorage).forEach((key) => {
            delete mockStorage[key];
          });
        }),
      },
      writable: true,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('should persist pomodoro settings between sessions', () => {
    // First hook instance to set data
    const { result: firstHook } = renderHook(() => usePomodoroStore());
    
    // Set custom durations
    act(() => {
      firstHook.current.setDuration(30); // 30 minutes
      firstHook.current.setBreakDuration(8); // 8 minutes
      firstHook.current.toggleSounds(); // Turn off sounds if on by default
    });
    
    // Unmount and create a new hook to simulate page refresh/reload
    const { result: secondHook } = renderHook(() => usePomodoroStore());
    
    // Check if settings were persisted
    expect(secondHook.current.duration).toBe(30 * 60); // In seconds
    expect(secondHook.current.breakDuration).toBe(8 * 60); // In seconds
    expect(secondHook.current.shouldPlaySounds).toBe(!firstHook.current.shouldPlaySounds);
  });

  test('should persist completed sessions history', () => {
    const userId = 'test-user';
    
    // Create first hook and add sessions
    const { result: firstHook } = renderHook(() => usePomodoroStore());
    
    act(() => {
      // Start and complete a session
      firstHook.current.startSession(userId);
      firstHook.current.stopSession(true);
      
      // Complete the break session
      firstHook.current.stopSession(true);
      
      // Start and abandon another session
      firstHook.current.startSession(userId);
      firstHook.current.stopSession(false);
    });
    
    // Should have 2 completed sessions (1 work, 1 break) and 1 abandoned
    expect(firstHook.current.sessions.length).toBe(3);
    
    // Create a new hook instance to test persistence
    const { result: secondHook } = renderHook(() => usePomodoroStore());
    
    // Session history should be persisted
    expect(secondHook.current.sessions.length).toBe(3);
    expect(secondHook.current.sessions.filter(s => s.status === 'completed').length).toBe(2);
    expect(secondHook.current.sessions.filter(s => s.status === 'abandoned').length).toBe(1);
  });

  test('should reset active state on rehydration', () => {
    const userId = 'test-user';
    
    // Create first hook and start a session
    const { result: firstHook } = renderHook(() => usePomodoroStore());
    
    act(() => {
      firstHook.current.startSession(userId);
    });
    
    // Session should be active
    expect(firstHook.current.isActive).toBe(true);
    expect(firstHook.current.isPaused).toBe(false);
    
    // Create a new hook to simulate page reload
    const { result: secondHook } = renderHook(() => usePomodoroStore());
    
    // Active state should be reset for safety
    expect(secondHook.current.isActive).toBe(false);
    expect(secondHook.current.isPaused).toBe(false);
    
    // But session history should still be there
    expect(secondHook.current.sessions.length).toBe(1);
  });

  test('should persist linked task id', () => {
    const taskId = 'task-123';
    
    // Create first hook and link a task
    const { result: firstHook } = renderHook(() => usePomodoroStore());
    
    act(() => {
      firstHook.current.setLinkedTaskId(taskId);
    });
    
    // Check the task is linked
    expect(firstHook.current.linkedTaskId).toBe(taskId);
    
    // Create a new hook to simulate page reload
    const { result: secondHook } = renderHook(() => usePomodoroStore());
    
    // Linked task should persist
    expect(secondHook.current.linkedTaskId).toBe(taskId);
  });

  test('should allow retrieving sessions by user ID after persistence', () => {
    const userId1 = 'user-1';
    const userId2 = 'user-2';
    
    // Create first hook and add sessions for different users
    const { result: firstHook } = renderHook(() => usePomodoroStore());
    
    act(() => {
      // User 1 sessions
      firstHook.current.startSession(userId1);
      firstHook.current.stopSession(true);
      
      // User 2 sessions
      firstHook.current.startSession(userId2);
      firstHook.current.stopSession(true);
      
      firstHook.current.startSession(userId2);
      firstHook.current.stopSession(false);
    });
    
    // Create a new hook to simulate page reload
    const { result: secondHook } = renderHook(() => usePomodoroStore());
    
    // Get sessions by user ID
    const user1Sessions = secondHook.current.getSessionsByUserId(userId1);
    const user2Sessions = secondHook.current.getSessionsByUserId(userId2);
    
    expect(user1Sessions.length).toBe(1);
    expect(user2Sessions.length).toBe(2);
  });
});
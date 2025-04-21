import { renderHook, act } from '@testing-library/react';
import { usePomodoroStore, usePomodoro } from '@/hooks/usePomodoro';

// Mock the Notification API
const mockNotification = jest.fn();
Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation((title, options) => {
    mockNotification(title, options);
    return {
      onclick: jest.fn(),
    };
  }),
});
window.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
Object.defineProperty(window.Notification, 'permission', {
  value: 'granted',
  configurable: true
});

// Mock Audio API
const mockPlay = jest.fn().mockReturnValue(Promise.resolve());
window.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
}));

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe('usePomodoroStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store before each test
    act(() => {
      usePomodoroStore.setState({
        isActive: false,
        isPaused: false,
        mode: 'work',
        timeRemaining: 25 * 60,
        duration: 25 * 60,
        breakDuration: 5 * 60,
        currentSession: null,
        sessions: [],
        linkedTaskId: null,
        shouldUseNotifications: true,
        shouldPlaySounds: true,
      });
    });
  });

  const mockUserId = 'user-123';
  const mockTaskId = 'task-456';

  test('should start a new pomodoro session', () => {
    // Arrange & Act
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId, mockTaskId);
    });

    // Assert
    expect(result.current.isActive).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.mode).toBe('work');
    expect(result.current.timeRemaining).toBe(25 * 60);
    expect(result.current.currentSession).not.toBeNull();
    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions[0].userId).toBe(mockUserId);
    expect(result.current.sessions[0].taskId).toBe(mockTaskId);
    expect(result.current.sessions[0].status).toBe('in_progress');
  });

  test('should start a session with custom durations', () => {
    // Arrange & Act
    const { result } = renderHook(() => usePomodoroStore());
    const customWorkMinutes = 30;
    const customBreakMinutes = 10;
    
    act(() => {
      result.current.startSession(mockUserId, mockTaskId, customWorkMinutes, customBreakMinutes);
    });

    // Assert
    expect(result.current.duration).toBe(customWorkMinutes * 60);
    expect(result.current.breakDuration).toBe(customBreakMinutes * 60);
    expect(result.current.timeRemaining).toBe(customWorkMinutes * 60);
  });

  test('should pause a session', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
    });
    
    // Act
    act(() => {
      result.current.pauseSession();
    });

    // Assert
    expect(result.current.isActive).toBe(true);
    expect(result.current.isPaused).toBe(true);
    expect(result.current.currentSession?.interruptions).toBe(1);
  });

  test('should resume a paused session', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
      result.current.pauseSession();
    });
    
    // Act
    act(() => {
      result.current.resumeSession();
    });

    // Assert
    expect(result.current.isActive).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  test('should stop and complete a work session', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId, mockTaskId);
    });
    
    // Act
    act(() => {
      result.current.stopSession(true);
    });

    // Assert
    expect(result.current.isActive).toBe(true); // Break started automatically
    expect(result.current.isPaused).toBe(false);
    expect(result.current.mode).toBe('break');
    expect(result.current.timeRemaining).toBe(5 * 60); // Break time
    expect(result.current.currentSession).toBeNull();
    expect(result.current.sessions[0].status).toBe('completed');
    expect(result.current.sessions[0].actualEndAt).toBeDefined();
  });

  test('should stop and abandon a session', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
    });
    
    // Act
    act(() => {
      result.current.stopSession(false);
    });

    // Assert
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.sessions[0].status).toBe('abandoned');
  });

  test('should reset timer', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
    });
    
    // Act
    act(() => {
      result.current.resetTimer();
    });

    // Assert
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.mode).toBe('work');
    expect(result.current.timeRemaining).toBe(25 * 60);
    expect(result.current.currentSession).toBeNull();
  });

  test('should set work duration', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const newDuration = 40; // minutes
    
    // Act
    act(() => {
      result.current.setDuration(newDuration);
    });

    // Assert
    expect(result.current.duration).toBe(newDuration * 60);
    expect(result.current.timeRemaining).toBe(newDuration * 60);
  });

  test('should set break duration', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const newBreakDuration = 15; // minutes
    
    // Act
    act(() => {
      result.current.setBreakDuration(newBreakDuration);
    });

    // Assert
    expect(result.current.breakDuration).toBe(newBreakDuration * 60);
  });

  test('should set linked task ID', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    // Act
    act(() => {
      result.current.setLinkedTaskId(mockTaskId);
    });

    // Assert
    expect(result.current.linkedTaskId).toBe(mockTaskId);
  });

  test('should toggle notifications setting', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const initialNotificationSetting = result.current.shouldUseNotifications;
    
    // Act
    act(() => {
      result.current.toggleNotifications();
    });

    // Assert
    expect(result.current.shouldUseNotifications).toBe(!initialNotificationSetting);
  });

  test('should toggle sounds setting', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const initialSoundSetting = result.current.shouldPlaySounds;
    
    // Act
    act(() => {
      result.current.toggleSounds();
    });

    // Assert
    expect(result.current.shouldPlaySounds).toBe(!initialSoundSetting);
  });

  test('should tick and update remaining time', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
    });
    
    const initialTimeRemaining = result.current.timeRemaining;
    
    // Act
    act(() => {
      result.current.tick();
    });

    // Assert
    expect(result.current.timeRemaining).toBe(initialTimeRemaining - 1);
  });

  test('should handle timer completion', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    
    act(() => {
      result.current.startSession(mockUserId);
      // Set time remaining to 1 second to trigger completion on next tick
      usePomodoroStore.setState({ timeRemaining: 1 });
    });
    
    // Act
    act(() => {
      result.current.tick();
    });

    // Assert
    expect(result.current.timeRemaining).toBe(300);
    expect(result.current.mode).toBe('break');
    expect(mockNotification).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  test('should filter sessions by user ID', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const otherUserId = 'other-user';
    
    act(() => {
      // Add session for main user
      result.current.startSession(mockUserId);
      result.current.stopSession(true);
      
      // Add session for other user
      result.current.startSession(otherUserId);
      result.current.stopSession(true);
    });

    // Act
    const userSessions = result.current.getSessionsByUserId(mockUserId);

    // Assert
    expect(userSessions.length).toBe(1);
    expect(userSessions[0].userId).toBe(mockUserId);
  });

  test('should filter sessions by task ID', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoroStore());
    const otherTaskId = 'other-task';
    
    act(() => {
      // Add session for main task
      result.current.startSession(mockUserId, mockTaskId);
      result.current.stopSession(true);
      
      // Add session for other task
      result.current.startSession(mockUserId, otherTaskId);
      result.current.stopSession(true);
    });

    // Act
    const taskSessions = result.current.getSessionsByTaskId(mockTaskId);

    // Assert
    expect(taskSessions.length).toBe(1);
    expect(taskSessions[0].taskId).toBe(mockTaskId);
  });
});

describe('usePomodoro hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store before each test
    act(() => {
      usePomodoroStore.setState({
        isActive: false,
        isPaused: false,
        mode: 'work',
        timeRemaining: 25 * 60,
        duration: 25 * 60,
        breakDuration: 5 * 60,
        currentSession: null,
        sessions: [],
        linkedTaskId: null,
        shouldUseNotifications: true,
        shouldPlaySounds: true,
      });
    });
  });

  test('should format time remaining correctly', () => {
    // Arrange & Act
    const { result } = renderHook(() => usePomodoro());
    
    act(() => {
      usePomodoroStore.setState({ timeRemaining: 65 }); // 1 minute and 5 seconds
    });

    // Assert
    expect(result.current.formattedTimeRemaining()).toBe('01:05');
  });

  test('should calculate progress correctly', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoro());
    const workDuration = 5 * 60; // 5 minutes
    
    act(() => {
      usePomodoroStore.setState({ 
        duration: workDuration,
        timeRemaining: workDuration / 2, // 50% progress
        mode: 'work'
      });
    });

    // Act & Assert
    expect(result.current.progress()).toBe(50);
  });

  test('should calculate break progress correctly', () => {
    // Arrange
    const { result } = renderHook(() => usePomodoro());
    const breakDuration = 3 * 60; // 3 minutes
    
    act(() => {
      usePomodoroStore.setState({ 
        breakDuration: breakDuration,
        timeRemaining: breakDuration / 4, // 75% progress
        mode: 'break'
      });
    });

    // Act & Assert
    expect(result.current.progress()).toBe(75);
  });
});
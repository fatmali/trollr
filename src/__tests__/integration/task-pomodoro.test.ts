import { renderHook, act } from '@testing-library/react';
import { usePomodoroStore } from '@/hooks/usePomodoro';
import { useTaskStore } from '@/hooks/useTasks';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('Task-Pomodoro Integration', () => {
  beforeEach(() => {
    // Reset stores before each test
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    const { result: taskResult } = renderHook(() => useTaskStore());
    
    act(() => {
      // Reset pomodoro state
      pomodoroResult.current.resetTimer();
      
      // Delete all tasks
      taskResult.current.tasks.forEach(task => {
        taskResult.current.deleteTask(task.id);
      });
    });
  });

  test('should link a task to a pomodoro session', () => {
    const { result: taskResult } = renderHook(() => useTaskStore());
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    
    let taskId: string;
    const userId = 'test-user-123';
    
    // Create a task
    act(() => {
      const task = taskResult.current.addTask(
        userId,
        'Linked Task',
        'Task to link with pomodoro',
        'medium'
      );
      taskId = task.id;
    });
    
    // Link task to pomodoro
    act(() => {
      pomodoroResult.current.setLinkedTaskId(taskId);
    });
    
    expect(pomodoroResult.current.linkedTaskId).toBe(taskId);
    
    // Start a pomodoro session
    act(() => {
      pomodoroResult.current.startSession(userId);
    });
    
    // Verify the session is linked to the task
    expect(pomodoroResult.current.currentSession?.taskId).toBe(taskId);
  });

  test('should update task pomodoro counts when completing a linked session', () => {
    const { result: taskResult } = renderHook(() => useTaskStore());
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    
    let taskId: string;
    const userId = 'test-user-123';
    
    // Create a task
    act(() => {
      const task = taskResult.current.addTask(
        userId,
        'Pomodoro Task',
        'Task for pomodoro tracking',
        'high'
      );
      taskId = task.id;
    });
    
    // Start a pomodoro session linked to the task
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
    });
    
    // Complete the pomodoro session
    act(() => {
      pomodoroResult.current.stopSession(true);
    });
    
    // Check if task pomodoro count was updated
    const updatedTask = taskResult.current.getTaskById(taskId);
    expect(updatedTask?.pomodoros.completed).toBe(1);
    expect(updatedTask?.pomodoros.abandoned).toBe(0);
  });

  test('should update task pomodoro counts when abandoning a linked session', () => {
    const { result: taskResult } = renderHook(() => useTaskStore());
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    
    let taskId: string;
    const userId = 'test-user-123';
    
    // Create a task
    act(() => {
      const task = taskResult.current.addTask(
        userId,
        'Pomodoro Task',
        'Task for pomodoro tracking',
        'high'
      );
      taskId = task.id;
    });
    
    // Start a pomodoro session linked to the task
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
    });
    
    // Abandon the pomodoro session
    act(() => {
      pomodoroResult.current.stopSession(false);
    });
    
    // Check if task pomodoro count was updated
    const updatedTask = taskResult.current.getTaskById(taskId);
    expect(updatedTask?.pomodoros.completed).toBe(0);
    expect(updatedTask?.pomodoros.abandoned).toBe(1);
  });

  test('should be able to unlink a task from active pomodoro', () => {
    const { result: taskResult } = renderHook(() => useTaskStore());
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    
    let taskId: string;
    const userId = 'test-user-123';
    
    // Create a task
    act(() => {
      const task = taskResult.current.addTask(
        userId,
        'Linked Task',
        'Task to link with pomodoro',
        'medium'
      );
      taskId = task.id;
    });
    
    // Start a pomodoro session with the linked task
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
    });
    
    expect(pomodoroResult.current.linkedTaskId).toBe(taskId);
    
    // Unlink the task
    act(() => {
      pomodoroResult.current.setLinkedTaskId(null);
    });
    
    // Verify the task is unlinked
    expect(pomodoroResult.current.linkedTaskId).toBeNull();
    
    // The session should continue without a task link
    expect(pomodoroResult.current.isActive).toBe(true);
  });

  test('should handle multiple pomodoro sessions for a single task', () => {
    const { result: taskResult } = renderHook(() => useTaskStore());
    const { result: pomodoroResult } = renderHook(() => usePomodoroStore());
    
    let taskId: string;
    const userId = 'test-user-123';
    
    // Create a task
    act(() => {
      const task = taskResult.current.addTask(
        userId,
        'Multi-Pomodoro Task',
        'Task requiring multiple pomodoros',
        'high'
      );
      taskId = task.id;
    });
    
    // First pomodoro session - completed
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
      pomodoroResult.current.stopSession(true);
    });
    
    // Second pomodoro session - abandoned
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
      pomodoroResult.current.stopSession(false);
    });
    
    // Third pomodoro session - completed
    act(() => {
      pomodoroResult.current.startSession(userId, taskId);
      pomodoroResult.current.stopSession(true);
    });
    
    // Check task pomodoro counts
    const updatedTask = taskResult.current.getTaskById(taskId);
    expect(updatedTask?.pomodoros.completed).toBe(2);
    expect(updatedTask?.pomodoros.abandoned).toBe(1);
    
    // Check session history
    const taskSessions = pomodoroResult.current.getSessionsByTaskId(taskId);
    expect(taskSessions.length).toBe(3);
    expect(taskSessions.filter(s => s.status === 'completed').length).toBe(2);
    expect(taskSessions.filter(s => s.status === 'abandoned').length).toBe(1);
  });
});
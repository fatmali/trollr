import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '@/hooks/useTasks';
import { TaskPriority } from '@/types';

// Mock UUID for predictable test results
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('useTaskStore', () => {
  beforeEach(() => {
    // Clear the tasks store before each test
    const { result } = renderHook(() => useTaskStore());
    act(() => {
      // Delete all existing tasks
      result.current.tasks.forEach(task => {
        result.current.deleteTask(task.id);
      });
    });
  });

  const mockUserId = 'user-123';
  const mockTask = {
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium' as TaskPriority,
    tags: ['test', 'jest'],
    codeSnippet: 'console.log("Hello");',
    deadline: new Date(2025, 4, 30).toISOString(),
  };

  test('should add a task', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority,
        mockTask.deadline,
        mockTask.tags,
        mockTask.codeSnippet
      );
    });

    // Assert
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe(mockTask.title);
    expect(result.current.tasks[0].userId).toBe(mockUserId);
    expect(result.current.tasks[0].status).toBe('not_started');
  });

  test('should update a task', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.updateTask(taskId, { title: 'Updated Title' });
    });

    // Assert
    expect(result.current.tasks[0].title).toBe('Updated Title');
  });

  test('should delete a task', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.deleteTask(taskId);
    });

    // Assert
    expect(result.current.tasks.length).toBe(0);
  });

  test('should complete a task', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.completeTask(taskId);
    });

    // Assert
    expect(result.current.tasks[0].status).toBe('completed');
    expect(result.current.tasks[0].completedAt).toBeDefined();
  });

  test('should mark a task in progress', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.markTaskInProgress(taskId);
    });

    // Assert
    expect(result.current.tasks[0].status).toBe('in_progress');
  });

  test('should find a task by id', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string = '';
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    const foundTask = result.current.getTaskById(taskId);

    // Assert
    expect(foundTask).toBeDefined();
    expect(foundTask?.id).toBe(taskId);
  });

  test('should update task status', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.setTaskStatus(taskId, 'overdue');
    });

    // Assert
    expect(result.current.tasks[0].status).toBe('overdue');
  });

  test('should update task pomodoros when completed', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.updateTaskPomodoros(taskId, true);
    });

    // Assert
    expect(result.current.tasks[0].pomodoros.completed).toBe(1);
    expect(result.current.tasks[0].pomodoros.abandoned).toBe(0);
  });

  test('should update task pomodoros when abandoned', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    act(() => {
      const task = result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      taskId = task.id;
    });

    // Act
    act(() => {
      result.current.updateTaskPomodoros(taskId, false);
    });

    // Assert
    expect(result.current.tasks[0].pomodoros.completed).toBe(0);
    expect(result.current.tasks[0].pomodoros.abandoned).toBe(1);
  });

  test('should filter tasks by user ID', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    const otherUserId = 'other-user';
    
    act(() => {
      // Add task for main user
      result.current.addTask(
        mockUserId,
        mockTask.title,
        mockTask.description,
        mockTask.priority
      );
      
      // Add task for other user
      result.current.addTask(
        otherUserId,
        'Other Task',
        'Other Description',
        mockTask.priority
      );
    });

    // Act
    const filteredTasks = result.current.getFilteredTasks({ userId: mockUserId });

    // Assert
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].userId).toBe(mockUserId);
  });

  test('should filter tasks by status', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    let taskId1: string = '';
    
    act(() => {
      const task1 = result.current.addTask(
        mockUserId,
        'Task 1',
        'Description 1',
        mockTask.priority
      );
      taskId1 = task1.id;
      
      
      // Complete task 1
      result.current.completeTask(taskId1);
    });

    // Act
    const completedTasks = result.current.getFilteredTasks({ 
      userId: mockUserId,
      status: ['completed'] 
    });

    // Assert
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0].id).toBe(taskId1);
  });

  test('should filter tasks by priority', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(
        mockUserId,
        'High Task',
        'High Priority Description',
        'high'
      );
      
      result.current.addTask(
        mockUserId,
        'Medium Task',
        'Medium Priority Description',
        'medium'
      );
    });

    // Act
    const highPriorityTasks = result.current.getFilteredTasks({ 
      userId: mockUserId,
      priority: ['high'] 
    });

    // Assert
    expect(highPriorityTasks.length).toBe(1);
    expect(highPriorityTasks[0].priority).toBe('high');
  });

  test('should filter tasks by tag', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(
        mockUserId,
        'Tagged Task',
        'Tagged Description',
        'medium',
        undefined,
        ['important', 'urgent']
      );
      
      result.current.addTask(
        mockUserId,
        'Untagged Task',
        'Untagged Description',
        'medium'
      );
    });

    // Act
    const importantTasks = result.current.getFilteredTasks({ 
      userId: mockUserId,
      tags: ['important'] 
    });

    // Assert
    expect(importantTasks.length).toBe(1);
    expect(importantTasks[0].tags).toContain('important');
  });

  test('should filter tasks by search query', () => {
    // Arrange
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(
        mockUserId,
        'Meeting with John',
        'Discuss project timeline',
        'medium'
      );
      
      result.current.addTask(
        mockUserId,
        'Code Review',
        'Review pull request #123',
        'medium'
      );
    });

    // Act
    const searchResults = result.current.getFilteredTasks({ 
      userId: mockUserId,
      searchQuery: 'meeting' 
    });

    // Assert
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].title).toContain('Meeting');
  });

  test('should add a new task', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(
        'user-123',
        'Test Task',
        'Test Description',
        'medium',
        '2025-05-01',
        ['test', 'important'],
        'console.log("test");'
      );
    });

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0]).toMatchObject({
      id: 'test-uuid-123',
      userId: 'user-123',
      title: 'Test Task',
      description: 'Test Description',
      priority: 'medium',
      status: 'not_started',
      tags: ['test', 'important'],
      codeSnippet: 'console.log("test");',
      pomodoros: {
        completed: 0,
        abandoned: 0
      }
    });
    expect(result.current.tasks[0].createdAt).toBeDefined();
    expect(result.current.tasks[0].deadline).toBe('2025-05-01');
  });

  test('should update an existing task', () => {
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    // First add a task
    act(() => {
      const task = result.current.addTask(
        'user-123',
        'Original Title',
        'Original Description',
        'low',
        undefined,
        []
      );
      taskId = task.id;
    });

    // Then update it
    act(() => {
      result.current.updateTask(taskId, {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high',
        tags: ['updated']
      });
    });

    const updatedTask = result.current.getTaskById(taskId);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.title).toBe('Updated Title');
    expect(updatedTask?.description).toBe('Updated Description');
    expect(updatedTask?.priority).toBe('high');
    expect(updatedTask?.tags).toEqual(['updated']);
    expect(updatedTask?.status).toBe('not_started'); // Should remain unchanged
  });

  test('should mark a task as completed', () => {
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    // First add a task
    act(() => {
      const task = result.current.addTask(
        'user-123',
        'Task to Complete',
        'This task will be completed',
        'medium'
      );
      taskId = task.id;
    });

    const beforeDate = new Date().toISOString();
    
    // Mark it as completed
    act(() => {
      result.current.completeTask(taskId);
    });

    const afterDate = new Date().toISOString();
    const completedTask = result.current.getTaskById(taskId);
    
    expect(completedTask).toBeDefined();
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completedAt).toBeDefined();
    
    // Verify completedAt timestamp is reasonable
    if (completedTask?.completedAt) {
      expect(completedTask.completedAt >= beforeDate).toBeTruthy();
      expect(completedTask.completedAt <= afterDate).toBeTruthy();
    }
  });

  test('should delete a task', () => {
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    // First add a task
    act(() => {
      const task = result.current.addTask(
        'user-123',
        'Task to Delete',
        'This task will be deleted',
        'low'
      );
      taskId = task.id;
    });

    expect(result.current.tasks.length).toBe(1);
    
    // Delete it
    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks.length).toBe(0);
    expect(result.current.getTaskById(taskId)).toBeUndefined();
  });

  test('should increment pomodoro counters correctly', () => {
    const { result } = renderHook(() => useTaskStore());
    let taskId: string;
    
    // Add a task
    act(() => {
      const task = result.current.addTask(
        'user-123',
        'Pomodoro Task',
        'Testing pomodoro counters',
        'medium'
      );
      taskId = task.id;
    });

    // Mark a completed pomodoro
    act(() => {
      result.current.updateTaskPomodoros(taskId, true);
    });

    let task = result.current.getTaskById(taskId);
    expect(task?.pomodoros.completed).toBe(1);
    expect(task?.pomodoros.abandoned).toBe(0);

    // Mark an abandoned pomodoro
    act(() => {
      result.current.updateTaskPomodoros(taskId, false);
    });

    task = result.current.getTaskById(taskId);
    expect(task?.pomodoros.completed).toBe(1);
    expect(task?.pomodoros.abandoned).toBe(1);
  });
});
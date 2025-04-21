import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '@/hooks/useTasks';
import { Task, TaskPriority, TaskStatus } from '@/types';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: jest.fn().mockImplementation(() => Math.random().toString(36).substring(2, 9))
}));

describe('Task Filtering and Organization', () => {
  const userId = 'test-user-filter';
  
  // Sample task data
  const sampleTasks = [
    {
      title: 'Implement login page',
      description: 'Create login form with validation',
      priority: 'high' as TaskPriority,
      status: 'in_progress' as TaskStatus,
      tags: ['frontend', 'auth', 'UI']
    },
    {
      title: 'Setup database schema',
      description: 'Define database tables and relations',
      priority: 'high' as TaskPriority,
      status: 'completed' as TaskStatus,
      tags: ['backend', 'database']
    },
    {
      title: 'Write unit tests',
      description: 'Add tests for user service',
      priority: 'medium' as TaskPriority,
      status: 'not_started' as TaskStatus,
      tags: ['testing', 'backend']
    },
    {
      title: 'Fix navigation bug',
      description: 'Navbar disappears on mobile view',
      priority: 'low' as TaskPriority,
      status: 'in_progress' as TaskStatus,
      tags: ['bug', 'UI']
    },
    {
      title: 'Update documentation',
      description: 'Update API docs with new endpoints',
      priority: 'low' as TaskPriority,
      status: 'not_started' as TaskStatus,
      tags: ['docs']
    }
  ];
  
  beforeEach(() => {
    // Reset task store
    const { result } = renderHook(() => useTaskStore());
    act(() => {
      // Clear existing tasks
      result.current.tasks.forEach(task => {
        result.current.deleteTask(task.id);
      });
      
      // Add sample tasks
      sampleTasks.forEach(task => {
        result.current.addTask(
          userId,
          task.title,
          task.description,
          task.priority,
          undefined,
          task.tags
        );
        
        // Update status for tasks that aren't "not_started" (the default)
        if (task.status !== 'not_started') {
          const addedTask = result.current.tasks[result.current.tasks.length - 1];
          result.current.setTaskStatus(addedTask.id, task.status);
        }
      });
    });
  });
  
  test('should filter tasks by status', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Get tasks by different statuses
    const notStartedTasks = result.current.getFilteredTasks({
      userId,
      status: ['not_started']
    });
    
    const inProgressTasks = result.current.getFilteredTasks({
      userId,
      status: ['in_progress']
    });
    
    const completedTasks = result.current.getFilteredTasks({
      userId,
      status: ['completed']
    });
    
    // Combined filter with multiple statuses
    const activeTasks = result.current.getFilteredTasks({
      userId,
      status: ['not_started', 'in_progress']
    });
    
    // Verify results
    expect(notStartedTasks.length).toBe(2);
    expect(inProgressTasks.length).toBe(2);
    expect(completedTasks.length).toBe(1);
    expect(activeTasks.length).toBe(4);
    
    // Verify content
    expect(notStartedTasks.every(task => task.status === 'not_started')).toBe(true);
    expect(inProgressTasks.every(task => task.status === 'in_progress')).toBe(true);
    expect(completedTasks.every(task => task.status === 'completed')).toBe(true);
  });
  
  test('should filter tasks by priority', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Get tasks by different priorities
    const highPriorityTasks = result.current.getFilteredTasks({
      userId,
      priority: ['high']
    });
    
    const mediumPriorityTasks = result.current.getFilteredTasks({
      userId,
      priority: ['medium']
    });
    
    const lowPriorityTasks = result.current.getFilteredTasks({
      userId,
      priority: ['low']
    });
    
    // Combined filter for high and medium tasks
    const importantTasks = result.current.getFilteredTasks({
      userId,
      priority: ['high', 'medium']
    });
    
    // Verify results
    expect(highPriorityTasks.length).toBe(2);
    expect(mediumPriorityTasks.length).toBe(1);
    expect(lowPriorityTasks.length).toBe(2);
    expect(importantTasks.length).toBe(3);
    
    // Verify content
    expect(highPriorityTasks.every(task => task.priority === 'high')).toBe(true);
    expect(mediumPriorityTasks.every(task => task.priority === 'medium')).toBe(true);
    expect(lowPriorityTasks.every(task => task.priority === 'low')).toBe(true);
  });
  
  test('should filter tasks by tags', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Get tasks by different tags
    const uiTasks = result.current.getFilteredTasks({
      userId,
      tags: ['UI']
    });
    
    const backendTasks = result.current.getFilteredTasks({
      userId,
      tags: ['backend']
    });
    
    // Verify results
    expect(uiTasks.length).toBe(2);
    expect(backendTasks.length).toBe(2);
    
    // Check tag containment
    expect(uiTasks.every(task => task.tags.includes('UI'))).toBe(true);
    expect(backendTasks.every(task => task.tags.includes('backend'))).toBe(true);
  });
  
  test('should filter tasks by search query', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Search by different terms that appear in title or description
    const loginTasks = result.current.getFilteredTasks({
      userId,
      searchQuery: 'login'
    });
    
    const bugTasks = result.current.getFilteredTasks({
      userId,
      searchQuery: 'bug'
    });
    
    const apiTasks = result.current.getFilteredTasks({
      userId,
      searchQuery: 'api'
    });
    
    // Verify results
    expect(loginTasks.length).toBe(1);
    expect(loginTasks[0].title).toContain('login');
    
    expect(bugTasks.length).toBe(1);
    expect(bugTasks[0].tags).toContain('bug');
    
    expect(apiTasks.length).toBe(1);
    expect(apiTasks[0].description).toContain('API');
  });
  
  test('should combine multiple filter criteria', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Complex filter: high priority tasks that are in-progress and related to UI
    const criticalUiTasks = result.current.getFilteredTasks({
      userId,
      status: ['in_progress'],
      priority: ['high'],
      tags: ['UI']
    });
    
    // Complex filter: active backend tasks (not_started or in_progress)
    const activeBackendTasks = result.current.getFilteredTasks({
      userId,
      status: ['not_started', 'in_progress'],
      tags: ['backend']
    });
    
    // Complex filter: low priority tasks with search term "doc"
    const lowPriorityDocTasks = result.current.getFilteredTasks({
      userId,
      priority: ['low'],
      searchQuery: 'doc'
    });
    
    // Verify results
    expect(criticalUiTasks.length).toBe(1);
    expect(criticalUiTasks[0].title).toBe('Implement login page');
    
    expect(activeBackendTasks.length).toBe(1);
    expect(activeBackendTasks[0].title).toBe('Write unit tests');
    
    expect(lowPriorityDocTasks.length).toBe(1);
    expect(lowPriorityDocTasks[0].title).toBe('Update documentation');
  });
  
  test('should handle empty filter results', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Filter with criteria that won't match any tasks
    const nonExistentTasks = result.current.getFilteredTasks({
      userId,
      status: ['overdue'],
      priority: ['high'],
      tags: ['nonexistent'],
      searchQuery: 'xyzabc123'
    });
    
    // Verify empty result
    expect(nonExistentTasks.length).toBe(0);
  });
  
  test('should only return tasks for the specified user', () => {
    const { result } = renderHook(() => useTaskStore());
    const otherUserId = 'other-user';
    
    // Add a task for another user
    act(() => {
      result.current.addTask(
        otherUserId,
        'Other user task',
        'This task belongs to another user',
        'medium'
      );
    });
    
    // Get all tasks for original user
    const userTasks = result.current.getFilteredTasks({
      userId
    });
    
    // Get all tasks for other user
    const otherUserTasks = result.current.getFilteredTasks({
      userId: otherUserId
    });
    
    // Verify each user only sees their own tasks
    expect(userTasks.length).toBe(5);
    expect(otherUserTasks.length).toBe(1);
    
    expect(userTasks.every(task => task.userId === userId)).toBe(true);
    expect(otherUserTasks.every(task => task.userId === otherUserId)).toBe(true);
  });
});
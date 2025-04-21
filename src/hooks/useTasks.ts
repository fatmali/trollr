'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskState {
  tasks: Task[];
  addTask: (
    userId: string,
    title: string,
    description: string,
    priority: TaskPriority,
    deadline?: string,
    tags?: string[],
    codeSnippet?: string
  ) => Task;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Task | null;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => Task | null;
  markTaskInProgress: (taskId: string) => Task | null;
  getTaskById: (taskId: string) => Task | undefined;
  setTaskStatus: (taskId: string, status: TaskStatus) => Task | null;
  updateTaskPomodoros: (taskId: string, completed: boolean) => Task | null;
  getFilteredTasks: (
    options: {
      status?: TaskStatus[],
      priority?: TaskPriority[],
      tags?: string[],
      searchQuery?: string,
      userId: string,
    }
  ) => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      
      addTask: (userId, title, description, priority, deadline, tags = [], codeSnippet) => {
        const newTask: Task = {
          id: uuidv4(),
          userId,
          title,
          description,
          codeSnippet,
          createdAt: new Date().toISOString(),
          deadline,
          priority,
          status: 'not_started',
          tags,
          pomodoros: {
            completed: 0,
            abandoned: 0,
          },
        };
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        
        return newTask;
      },
      
      updateTask: (taskId, updates) => {
        let updatedTask: Task | null = null;
        
        set((state) => {
          const updatedTasks = state.tasks.map((task) => {
            if (task.id === taskId) {
              updatedTask = { ...task, ...updates };
              return updatedTask;
            }
            return task;
          });
          
          return { tasks: updatedTasks };
        });
        
        return updatedTask;
      },
      
      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
      },
      
      completeTask: (taskId) => {
        return get().updateTask(taskId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      },
      
      markTaskInProgress: (taskId) => {
        return get().updateTask(taskId, {
          status: 'in_progress',
        });
      },
      
      getTaskById: (taskId) => {
        return get().tasks.find((task) => task.id === taskId);
      },
      
      setTaskStatus: (taskId, status) => {
        const updates: Partial<Task> = { status };
        
        // If completing the task, add a completedAt timestamp
        if (status === 'completed') {
          updates.completedAt = new Date().toISOString();
        }
        
        // If marking as overdue, make sure it doesn't have a completedAt timestamp
        if (status === 'overdue') {
          updates.completedAt = undefined;
        }
        
        return get().updateTask(taskId, updates);
      },
      
      updateTaskPomodoros: (taskId, completed) => {
        const task = get().getTaskById(taskId);
        if (!task) return null;
        
        const updatedPomodoros = { ...task.pomodoros };
        
        if (completed) {
          updatedPomodoros.completed += 1;
        } else {
          updatedPomodoros.abandoned += 1;
        }
        
        return get().updateTask(taskId, { pomodoros: updatedPomodoros });
      },
      
      getFilteredTasks: ({ status, priority, tags, searchQuery, userId }) => {
        return get().tasks.filter((task) => {
          // Filter by user ID
          if (task.userId !== userId) return false;
          
          // Filter by status
          if (status && status.length > 0 && !status.includes(task.status)) return false;
          
          // Filter by priority
          if (priority && priority.length > 0 && !priority.includes(task.priority)) return false;
          
          // Filter by tags (if task has at least one of the specified tags)
          if (tags && tags.length > 0 && !task.tags.some(tag => tags.includes(tag))) return false;
          
          // Filter by search query (search in title and description)
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              task.title.toLowerCase().includes(query) ||
              task.description.toLowerCase().includes(query)
            );
          }
          
          return true;
        });
      },
    }),
    {
      name: 'trollr-tasks-storage',
    }
  )
);
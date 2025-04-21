'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { useTaskStore } from '@/hooks/useTasks';
import { useLocalUser } from '@/context/LocalUserProvider';
import { useTrollMessages } from '@/hooks/useTrollMessages';
import { usePomodoroStore } from '@/hooks/usePomodoro';

interface TaskFormProps {
  userId: string;
  initialTask?: Task;
  onSubmit: () => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  userId,
  initialTask,
  onSubmit,
  onCancel,
}) => {
  const { addTask, updateTask } = useTaskStore();
  const { stats } = useLocalUser();
  const { generateMessage } = useTrollMessages();
  const pomodoroStore = usePomodoroStore();
  
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'not_started');
  const [deadline, setDeadline] = useState(initialTask?.deadline ? new Date(initialTask.deadline).toISOString().split('T')[0] : '');
  const [tags, setTags] = useState(initialTask?.tags.join(', ') || '');
  const [codeSnippet, setCodeSnippet] = useState(initialTask?.codeSnippet || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPomodoroWarning, setShowPomodoroWarning] = useState(false);
  const [isLinkedToPomodoro, setIsLinkedToPomodoro] = useState(false);

  // Check if task is linked to an active pomodoro
  useEffect(() => {
    if (initialTask?.id) {
      const isLinked = pomodoroStore.isActive && pomodoroStore.linkedTaskId === initialTask.id;
      setIsLinkedToPomodoro(isLinked);
    }
  }, [initialTask?.id, pomodoroStore.isActive, pomodoroStore.linkedTaskId]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // If moving an active pomodoro task back to todo, show warning
    if (initialTask?.status === 'in_progress' && status === 'not_started' && isLinkedToPomodoro) {
      setShowPomodoroWarning(true);
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Process tags
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Convert deadline to ISO string if it exists
    const deadlineISO = deadline ? new Date(deadline).toISOString() : undefined;
    
    if (initialTask?.id) {
      // Editing existing task
      updateTask(initialTask.id, {
        title,
        description,
        priority,
        status,
        deadline: deadlineISO,
        tags: tagArray,
        codeSnippet: codeSnippet || undefined,
      });
      
      // If we're changing status and the task is linked to a pomodoro timer, unlink it
      if (initialTask.status !== status && isLinkedToPomodoro && status === 'not_started') {
        pomodoroStore.setLinkedTaskId(null);
      }
    } else {
      // Creating new task
      addTask(userId, title, description, priority, deadlineISO, tagArray, codeSnippet || undefined);
      
      // Generate a trollr message for new task
      const context = {
        userData: {
          id: userId,
          displayName: "Developer",
          workHabits: [],
          commonExcuses: [],
          productivityPatterns: [],
          stats: stats
        },
        timeData: {
          timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        }
      };
      
      generateMessage(userId, context, 'inactivity');
    }
    
    onSubmit();
  };

  // Handle confirmation to continue despite pomodoro reset
  const handleContinueAnyway = () => {
    setShowPomodoroWarning(false);
    
    // Process tags
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Convert deadline to ISO string if it exists
    const deadlineISO = deadline ? new Date(deadline).toISOString() : undefined;
    
    if (initialTask?.id) {
      // Reset pomodoro timer
      if (isLinkedToPomodoro) {
        pomodoroStore.setLinkedTaskId(null);
      }
      
      // Update task, including status change
      updateTask(initialTask.id, {
        title,
        description,
        priority,
        status,
        deadline: deadlineISO,
        tags: tagArray,
        codeSnippet: codeSnippet || undefined,
      });
    }
    
    onSubmit();
  };
  
  return (
    <>
      {showPomodoroWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPomodoroWarning(false)}>
          <div className="rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in glass-morphism" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-2">Warning!</h3>
            <p className="text-muted-foreground mb-4">
              This task is linked to an active Pomodoro timer. Moving it back to todo will reset the Pomodoro timer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPomodoroWarning(false)}
                className="px-3 py-1.5 rounded-md text-sm bg-muted text-muted-foreground hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueAnyway}
                className="px-3 py-1.5 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold">{initialTask ? 'Edit Task' : 'Add New Task'}</h2>
        
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-background ${
              errors.title ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>
        
        <div>
          <label htmlFor="description" className="block mb-1 font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block mb-1 font-medium">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          {initialTask && (
            <div>
              <label htmlFor="status" className="block mb-1 font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="not_started">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {isLinkedToPomodoro && status === 'not_started' && initialTask.status !== 'not_started' && (
                <p className="mt-1 text-xs text-amber-500">
                  Warning: Changing to To Do will reset the Pomodoro timer
                </p>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="deadline" className="block mb-1 font-medium">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="tags" className="block mb-1 font-medium">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. work, important, frontend"
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>
        
        <div>
          <label htmlFor="codeSnippet" className="block mb-1 font-medium">
            Code Snippet (Optional)
          </label>
          <textarea
            id="codeSnippet"
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md font-mono text-sm bg-background"
            placeholder="// Paste your code here"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 transition-opacity"
          >
            {initialTask ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </>
  );
};
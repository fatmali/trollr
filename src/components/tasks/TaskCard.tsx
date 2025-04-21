'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import { useTaskStore } from '@/hooks/useTasks';
import { usePomodoroStore } from '@/hooks/usePomodoro';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask } = useTaskStore();
  const pomodoroStore = usePomodoroStore();
  const [showResetWarning, setShowResetWarning] = useState(false);
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = date.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return 'Overdue';
    } else if (daysDiff === 0) {
      return 'Due today';
    } else if (daysDiff === 1) {
      return 'Due tomorrow';
    } else if (daysDiff <= 3) {
      return `Due in ${daysDiff} days`;
    } else {
      return `Due ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }
  };
  
  // Calculate if task is overdue
  const isOverdue = () => {
    if (!task.deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today && task.status !== 'completed';
  };

  // Check if task is linked to an active pomodoro
  const isLinkedToActivePomodoro = () => {
    return pomodoroStore.isActive && pomodoroStore.linkedTaskId === task.id;
  };

  // Handle click on task card
  const handleTaskClick = () => {
    // Simply open the edit form on click - don't trigger the pomodoro warning
    onEdit(task);
  };

  // Handle confirmation to continue editing despite pomodoro reset
  const handleContinueAnyway = () => {
    setShowResetWarning(false);
    
    // Reset pomodoro if this task is linked to it
    if (isLinkedToActivePomodoro()) {
      pomodoroStore.setLinkedTaskId(null);
      pomodoroStore.resetTimer(); // Properly reset the timer
    }
    
    onEdit(task);
  };

  return (
    <>
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowResetWarning(false)}>
          <div className="rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in glass-morphism" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-2">Warning!</h3>
            <p className="text-muted-foreground mb-4">
              This task is linked to an active Pomodoro timer. Moving it back to todo will reset the Pomodoro timer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetWarning(false)}
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
    
      <div 
        className={`p-2.5 glass-morphism-hover ${
          isLinkedToActivePomodoro() 
            ? 'task-card-active animated-gradient-border shadow-glow animate-pulse-slow bg-primary/5 dark:bg-primary/10' 
            : 'task-card glass-morphism'
        }`}
        onClick={handleTaskClick}
      >
        <div className="flex justify-between items-start gap-1">
          <h4 className="font-medium text-foreground text-sm flex items-center">
            <span 
              className={`inline-flex shrink-0 w-2.5 h-2.5 rounded-full mr-1.5 ${
                task.priority === 'high' 
                  ? 'border-2 border-rose-500' // Outlined style for high priority
                  : task.priority === 'medium'
                  ? 'border-2 border-amber-400' // Outlined style for medium priority
                  : 'border-2 border-emerald-400' // Outlined style for low priority
              }`}
              title={`${task.priority} priority`}
              aria-label={`${task.priority} priority`}
            ></span>
            {task.title}
            {isOverdue() && (
              <span className="ml-1 text-xs text-destructive">overdue</span>
            )}
          </h4>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Check if task is linked to active pomodoro before delete
              if (isLinkedToActivePomodoro()) {
                if (confirm('This task is linked to an active Pomodoro timer. Deleting it will reset the timer. Continue?')) {
                  // Reset pomodoro if needed
                  pomodoroStore.setLinkedTaskId(null);
                  pomodoroStore.resetTimer(); // Properly reset the timer
                  deleteTask(task.id);
                }
              } else {
                deleteTask(task.id);
              }
            }}
            className="text-muted-foreground hover:text-destructive transition-colors ml-1 -mt-1 z-10"
            aria-label="Delete task"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
        )}
        
        <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
          {task.deadline ? (
            <span className={isOverdue() ? 'text-destructive' : ''}>
              {formatDate(task.deadline)}
            </span>
          ) : (
            <span>No deadline</span>
          )}
          
          <span className="text-xs">
            {task.status === 'completed' ? '✓' : 
              task.status === 'in_progress' ? '⟳' : '○'}
          </span>
        </div>
      </div>
    </>
  );
};
'use client';

import React, { useState, useEffect } from 'react';
import { NavbarPomodoroTimer } from '../pomodoro/NavbarPomodoroTimer';
import { LofiPlayer } from './LofiPlayer';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useLocalUser } from '@/context/LocalUserProvider';
import { useTaskStore } from '@/hooks/useTasks';
import { useLofiStore } from '@/hooks/useLofiStore';
import { ConfettiEffect } from './ConfettiEffect';

interface ProductivityDockProps {
  className?: string;
}

export const ProductivityDock: React.FC<ProductivityDockProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pomodoro = usePomodoro();
  const { userId } = useLocalUser();
  const taskStore = useTaskStore();
  const lofiStore = useLofiStore();
  
  // Drop zone state
  const [isDragOver, setIsDragOver] = useState(false);
  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
    
  // Get the linked task if one exists
  const linkedTask = pomodoro.linkedTaskId 
    ? taskStore.getTaskById(pomodoro.linkedTaskId) 
    : null;
  
  // Unified function to toggle Pomodoro timer (but not auto-start)
  const togglePomodoroAndMusic = () => {
    if (!pomodoro.isActive) {
      // Start a new session
      pomodoro.startSession(
        userId,
        pomodoro.linkedTaskId || undefined,
        undefined, // Use default durations
        undefined
      );
      // Music will automatically start due to the effect hook below
    } else if (pomodoro.isPaused) {
      // Resume the session
      pomodoro.resumeSession();
      // Music will automatically resume due to the effect hook below
    } else {
      // Pause the session
      pomodoro.pauseSession();
      // Music will automatically pause due to the effect hook below
    }
  };

  const resetSessionWithMusic = () => {
    if (pomodoro.isActive) {
      // First stop the session
      pomodoro.stopSession(false); // Set to false to indicate it wasn't completed
      
      // Then explicitly reset the timer to ensure it returns to default state
      if (pomodoro.resetTimer) {
        pomodoro.resetTimer();
      }
    }
    
    // Always completely stop music and reset state
    lofiStore.pause(false);
  };
  
  // Function to mark a task as completed
  const markTaskAsCompleted = (taskId: string) => {
    if (taskId) {
      taskStore.completeTask(taskId);
      
      // Trigger confetti animation
      setShowConfetti(true);
      
      // If this task was linked to the current pomodoro, unlink it
      if (pomodoro.linkedTaskId === taskId) {
        pomodoro.setLinkedTaskId(null);
      }
    }
  };
  
  // Function to unlink a task from the pomodoro
  const unlinkTask = () => {
    pomodoro.setLinkedTaskId(null);
  };
  
  // Handle drop zone events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      // Link the dropped task
      pomodoro.setLinkedTaskId(taskId);
      
      // If the task is not in progress, mark it as in progress
      const task = taskStore.getTaskById(taskId);
      if (task && task.status !== 'in_progress') {
        taskStore.markTaskInProgress(taskId);
      }
    }
  };

  // Effect to sync the Pomodoro timer state with the LoFi player
  useEffect(() => {
    if (pomodoro.isActive && !pomodoro.isPaused) {
      lofiStore.play();
    } else {
      lofiStore.pause(true); // true means remember state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.isActive, pomodoro.isPaused]);
  
  return (
    <div 
      className={`fixed bottom-16 left-1/2 transform -translate-x-1/2 z-40 flex flex-col gap-2 ${className}`}
    >
      {/* Confetti Effect */}
      <ConfettiEffect 
        showConfetti={showConfetti} 
        type="success" 
        onComplete={() => setShowConfetti(false)}
      />
      
      <div 
        className={`
          transition-colors duration-100 ease cursor-pointer
          ${isExpanded 
            ? 'rounded-lg bg-background/95 shadow-lg p-3 border border-border w-[560px] max-w-[90vw]' 
            : 'rounded-full bg-background/90 py-2 px-4 border border-border shadow-md hover:bg-background/95 hover:shadow-lg w-[560px] max-w-[90vw]'
          }
          backdrop-blur-md
        `}
        onClick={(e) => {
          // Check if not clicking on a control button
          const isControlButton = (target: EventTarget) => {
            const element = target as HTMLElement;
            return element.closest('button') !== null && 
              !element.classList.contains('dock-toggle-area') && 
              !element.parentElement?.classList.contains('dock-toggle-area');
          };
          
          if (!isControlButton(e.target)) {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {isExpanded ? (
          // Expanded View
          <div className="flex flex-col gap-4 w-full">
            {/* Quick access tools */}
            <div className="flex items-center justify-between gap-5 dock-toggle-area">
              {/* Pomodoro Timer with label */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground dock-toggle-area">Focus</span>
                  <div className="text-lg font-medium">
                    <NavbarPomodoroTimer dockMode/>
                  </div>
                </div>
                
                {/* Timer controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePomodoroAndMusic();
                    }}
                    className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    aria-label={
                      !pomodoro.isActive 
                        ? "Start focus session" 
                        : pomodoro.isPaused 
                          ? "Resume focus session" 
                          : "Pause focus session"
                    }
                  >
                    {!pomodoro.isActive || pomodoro.isPaused ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                    )}
                  </button>
                  
                  {/* Show stop button only when session is active */}
                  {pomodoro.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetSessionWithMusic();
                      }}
                      className="flex items-center justify-center h-9 w-9 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      aria-label="Stop and reset focus session"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expand/collapse button */}
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors dock-toggle-area"
                aria-label="Collapse productivity tools"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dock-toggle-area">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </div>
            
            {/* Task management section - Now a drop target */}
            <div 
              className={`bg-background/60 rounded-md p-3 border ${isDragOver ? 'border-primary border-dashed border-2' : 'border-border/50'} transition-all duration-200`} 
              onClick={(e) => e.stopPropagation()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Focusing on:</h3>
                
                {/* Controls based on whether a task is linked */}
                {linkedTask && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markTaskAsCompleted(linkedTask.id)}
                      className="text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 flex items-center gap-1"
                      aria-label="Mark task as completed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Complete
                    </button>
                    <button
                      onClick={unlinkTask}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                      aria-label="Unlink task from Pomodoro"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Unlink
                    </button>
                  </div>
                )}
              </div>
              
              {/* Task display or empty state with drop zone */}
              {linkedTask ? (
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{linkedTask.title}</h4>
                      {linkedTask.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{linkedTask.description}</p>
                      )}
                      <div className="flex items-center mt-1.5 gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityStyles(linkedTask.priority)}`}>
                          {linkedTask.priority}
                        </span>
                        {linkedTask.pomodoros.completed > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {linkedTask.pomodoros.completed} pomodoro{linkedTask.pomodoros.completed !== 1 ? 's' : ''} completed
                          </span>
                        )}
                      </div>
                    </div>
                </div>
              ) : (
                <div className={`bg-card/50 rounded border ${isDragOver ? 'border-primary border-2' : 'border-dashed border-border/60'} p-3 text-center transition-all duration-200`}>
                  {isDragOver ? (
                    <p className="text-sm text-primary">Release to link this task</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Drag a task here to focus on it</p>
                      <div className="flex justify-center mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
                          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                          <path d="M12 11v6"/>
                          <path d="m9 14 3-3 3 3"/>
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          
            {/* Divider */}
            <div className="h-px w-full bg-border opacity-70"></div>
            
            {/* Expanded LoFi player */}
            <div className="w-full bg-background/80 rounded-md" onClick={(e) => e.stopPropagation()}>
              <LofiPlayer minimal={false} />
            </div>
          </div>
        ) : (
          // Collapsed View
          <div className="flex flex-row items-center justify-between relative">
            {/* Pomodoro Timer */}
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              {/* Use simplified NavbarPomodoroTimer without its own controls */}
              <NavbarPomodoroTimer dockMode={true} />
            </div>
            <div className="flex">
            {/* Separator */}
            <div className="mx-3 h-6 w-px bg-border/50"></div>
            
            {/* Display the lofi station information */}
            <div className="flex-1 flex items-center" onClick={(e) => e.stopPropagation()}>
              <LofiPlayer minimal={true} />
            </div>
            
            {/* Controls group at far right */}
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              {/* Show Link Task button if no task is linked */}
              {!linkedTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="flex items-center justify-center h-8 rounded-full bg-muted/70 px-3 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Link a task to focus on"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Link Task
                </button>
              )}
              
              {/* Unified play/pause control */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePomodoroAndMusic();
                }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                aria-label={
                  !pomodoro.isActive 
                    ? "Start focus session" 
                    : pomodoro.isPaused 
                      ? "Resume focus session" 
                      : "Pause focus session"
                }
              >
                {!pomodoro.isActive || pomodoro.isPaused ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                )}
              </button>
              
              {/* Show stop button (square) only when session is active */}
              {pomodoro.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSessionWithMusic();
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  aria-label="Stop and reset focus session"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                </button>
              )}
              
              {/* Expand button - properly positioned */}
              <button 
                className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors dock-toggle-area"
                aria-label="Expand productivity tools"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dock-toggle-area">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for priority styling
function getPriorityStyles(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    case 'medium':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    case 'low':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}
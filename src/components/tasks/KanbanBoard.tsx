"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, TaskStatus } from "@/types";
import { useTaskStore } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { useLocalUser } from "@/context/LocalUserProvider";
import { usePomodoroStore } from "@/hooks/usePomodoro";
import { TaskFormPopup, ConfirmationDialog } from "./TaskPopups";

export const KanbanBoard: React.FC = () => {
  const { userId } = useLocalUser();
  const { getFilteredTasks, updateTask, addTask } = useTaskStore();
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [caretPosition, setCaretPosition] = useState<number | null>(null);

  // Check for mobile viewport on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [isQuickTaskFormVisible, setIsQuickTaskFormVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationCallback, setConfirmationCallback] = useState<() => void>(() => {});

  // Handle textarea input with proper caret position maintenance
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart;
    setQuickTaskTitle(newValue);
    setCaretPosition(newPosition);
  };

  // Restore caret position after render
  useEffect(() => {
    if (isQuickTaskFormVisible && textareaRef.current && caretPosition !== null) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(caretPosition, caretPosition);
    }
  }, [quickTaskTitle, isQuickTaskFormVisible, caretPosition]);

  // Reset caret position when form is closed
  useEffect(() => {
    if (!isQuickTaskFormVisible) {
      setCaretPosition(null);
    }
  }, [isQuickTaskFormVisible]);

  // Function to handle quick task creation
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickTaskTitle.trim()) return;

    // Create a new task with just the title
    addTask(userId, quickTaskTitle, "", "medium", undefined, [], undefined);

    // Reset form
    setQuickTaskTitle("");
    setIsQuickTaskFormVisible(false);
  };

  // Handles cancel of quick task form
  const handleQuickTaskCancel = () => {
    setQuickTaskTitle("");
    setIsQuickTaskFormVisible(false);
  };

  // Handle clicking on the empty column message to show quick form
  const handleEmptyColumnClick = () => {
    setIsQuickTaskFormVisible(true);
  };

  // Handle clicking on add button in column header
  const handleAddButtonClick = () => {
    setIsQuickTaskFormVisible(true);
    setIsFormVisible(false);
    // Reset caret position when opening form
    setCaretPosition(0);
    // Focus the textarea after showing it
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Get all tasks
  const allTasks = getFilteredTasks({ userId });
  const pomodoroStore = usePomodoroStore();
  const activePomodroTaskId = pomodoroStore.isActive ? pomodoroStore.linkedTaskId : null;

  // Group tasks by status
  const notStartedTasks = allTasks.filter(
    (task) => task.status === "not_started"
  );
  
  // Sort in-progress tasks to put active pomodoro task first
  const inProgressTasks = allTasks
    .filter((task) => task.status === "in_progress")
    .sort((a, b) => {
      // If task is linked to active pomodoro, put it first
      if (a.id === activePomodroTaskId) return -1;
      if (b.id === activePomodroTaskId) return 1;
      return 0; // Keep original order for other tasks
    });
    
  const doneTasks = allTasks.filter((task) => task.status === "completed");

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Get active pomodoro state
    const pomodoroStore = usePomodoroStore.getState();
    const isLinkedToActivePomodoro = pomodoroStore.isActive && pomodoroStore.linkedTaskId === taskId;
    
    // If task is in_progress and linked to pomodoro, and being moved back to not_started
    if (task.status === "in_progress" && isLinkedToActivePomodoro && newStatus === "not_started") {
      // Show confirmation dialog
      setConfirmationMessage("This task is linked to an active Pomodoro timer. Moving it back to todo will reset the Pomodoro timer. Continue?");
      setConfirmationCallback(() => () => {
        // User confirmed - reset the pomodoro and move task
        pomodoroStore.setLinkedTaskId(null);
        pomodoroStore.resetTimer(); // Properly reset the timer
        updateTask(taskId, { status: newStatus });
      });
      setIsConfirmationVisible(true);
    } 
    // If task is linked to pomodoro and being moved to completed
    else if (isLinkedToActivePomodoro && newStatus === "completed") {
      // Show confirmation dialog
      setConfirmationMessage("This task is linked to an active Pomodoro timer. Marking it as complete will reset the Pomodoro timer. Continue?");
      setConfirmationCallback(() => () => {
        // User confirmed - reset the pomodoro and mark task as complete
        pomodoroStore.setLinkedTaskId(null);
        pomodoroStore.resetTimer();
        updateTask(taskId, { status: newStatus });
      });
      setIsConfirmationVisible(true);
    } else {
      // Normal case - just update the task
      updateTask(taskId, { status: newStatus });
    }
  };

  // Handle status change for mobile view
  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Get active pomodoro state
    const pomodoroStore = usePomodoroStore.getState();
    const isLinkedToActivePomodoro = pomodoroStore.isActive && pomodoroStore.linkedTaskId === taskId;
    
    // If task is in_progress and linked to pomodoro, and being moved back to not_started
    if (task.status === "in_progress" && isLinkedToActivePomodoro && newStatus === "not_started") {
      // Show confirmation dialog
      setConfirmationMessage("This task is linked to an active Pomodoro timer. Moving it back to todo will reset the Pomodoro timer. Continue?");
      setConfirmationCallback(() => () => {
        // User confirmed - reset the pomodoro and move task
        pomodoroStore.setLinkedTaskId(null);
        pomodoroStore.resetTimer();
        updateTask(taskId, { status: newStatus });
      });
      setIsConfirmationVisible(true);
    } 
    // If task is linked to pomodoro and being moved to completed
    else if (isLinkedToActivePomodoro && newStatus === "completed") {
      // Show confirmation dialog
      setConfirmationMessage("This task is linked to an active Pomodoro timer. Marking it as complete will reset the Pomodoro timer. Continue?");
      setConfirmationCallback(() => () => {
        // User confirmed - reset the pomodoro and mark task as complete
        pomodoroStore.setLinkedTaskId(null);
        pomodoroStore.resetTimer();
        updateTask(taskId, { status: newStatus });
      });
      setIsConfirmationVisible(true);
    } else {
      // Normal case - just update the task
      updateTask(taskId, { status: newStatus });
    }
  };

  // Funny messages for empty columns
  const emptyColumnMessages = {
    not_started: {
      title: "Nothing here yet",
      subtitle: "Add some tasks you'll probably never do",
    },
    in_progress: {
      title: "Not doing anything?",
      subtitle: "At least pretend you're productive",
    },
    completed: {
      title: "Finished nothing?",
      subtitle: "Why am I not surprised...",
    },
  };

  // Mobile Task Item component
  const MobileTaskItem = ({ task }: { task: Task }) => {
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    
    const statusConfig = {
      not_started: {
        label: "To Do",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        ),
        color: "bg-slate-100 border-slate-200 text-slate-700",
      },
      in_progress: {
        label: "In Progress",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
        ),
        color: "bg-blue-50 border-blue-100 text-blue-700",
      },
      completed: {
        label: "Completed",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        ),
        color: "bg-green-50 border-green-100 text-green-700",
      },
    };

    // Function to render status badge with appropriate visual styling
    const renderStatusBadge = () => {
      const config = statusConfig[task.status as keyof typeof statusConfig];
      return (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${config.color} cursor-pointer`}
          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
        >
          <span className="flex items-center">{config.icon}</span>
          <span>{config.label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      );
    };

    return (
      <div className="mb-4 bg-background p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </h4>
          {task.id === activePomodroTaskId && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Pomodoro Active
            </span>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className="relative">
            {renderStatusBadge()}
            
            {/* Status change menu */}
            {isStatusMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-background rounded-md shadow-md border border-border z-10 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => {
                      handleTaskStatusChange(task.id, status as TaskStatus);
                      setIsStatusMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                      task.status === status ? 'bg-muted/50' : ''
                    }`}
                  >
                    <span className="flex items-center">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <button 
              onClick={() => {
                setEditingTask(task);
                setIsFormVisible(true);
              }}
              className="text-xs text-primary hover:text-primary-hover ml-2 flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile view component 
  const MobileKanbanView = () => {
    const [activeTab, setActiveTab] = useState<TaskStatus>("not_started");
    
    // Get tasks for the active tab
    const getTasksForTab = () => {
      switch (activeTab) {
        case "not_started":
          return notStartedTasks;
        case "in_progress":
          return inProgressTasks;
        case "completed":
          return doneTasks;
        default:
          return notStartedTasks;
      }
    };
    
    const currentTasks = getTasksForTab();
    
    return (
      <div className="mt-4">
        {/* Tab navigation */}
        <div className="flex border-b border-border relative">
          <button
            className={`flex-1 py-3 text-xs font-medium transition-all duration-200 rounded-t-md ease-in-out ${
              activeTab === "not_started" 
                ? "bg-black text-white" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("not_started")}
          >
            To Do
          </button>
          <button
            className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ease-in-out rounded-t-md ${
              activeTab === "in_progress" 
                ? "bg-black text-white" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("in_progress")}
          >
            In Progress
          </button>
          <button
            className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ease-in-out rounded-t-md ${
              activeTab === "completed" 
                ? "bg-black text-white" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Done
          </button>
          {/* Animated indicator line */}
          <div 
            className="absolute bottom-0 h-0.5 bg-black transition-all duration-300 ease-in-out"
            style={{
              left: activeTab === "not_started" ? "0%" : 
                    activeTab === "in_progress" ? "33.333%" : "66.666%",
              width: "33.333%"
            }}
          />
        </div>
        
        {/* Tasks list */}
        <div className="mt-4 transition-all duration-300 ease-in-out">
          {activeTab === "not_started" && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleAddButtonClick}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary-hover p-1 rounded-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add Task</span>
              </button>
            </div>
          )}
          
          {isQuickTaskFormVisible && activeTab === "not_started" && (
            <div className="mb-4 p-2 rounded-md glass-morphism animate-fade-in">
              <form onSubmit={handleQuickTaskSubmit} className="relative">
                <textarea
                  ref={textareaRef}
                  value={quickTaskTitle}
                  onChange={handleTextAreaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (quickTaskTitle.trim() !== '') {
                        handleQuickTaskSubmit(e);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 pb-8 text-sm bg-background/50 outline-0 focus:outline-0 focus:ring-0 outline-none ring-0 resize-none rounded-lg backdrop-blur-sm"
                  placeholder="Enter task title..."
                  autoFocus
                  rows={2}
                />
                <div className="absolute bottom-4 right-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleQuickTaskCancel}
                    className="text-xs text-muted-foreground hover:text-muted-foreground-hover cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickTaskTitle.trim() === ""}
                    className="text-xs text-primary-foreground hover:text-primary-foreground cursor-pointer px-2 py-1 rounded-sm bg-primary"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {currentTasks.length === 0 ? (
            <div
              className="text-center p-4 rounded-md cursor-pointer border border-dashed border-border"
              onClick={activeTab === "not_started" ? handleEmptyColumnClick : undefined}
            >
              <p className="text-muted-foreground text-sm">
                {emptyColumnMessages[activeTab as keyof typeof emptyColumnMessages].title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 trollr-text">
                {emptyColumnMessages[activeTab as keyof typeof emptyColumnMessages].subtitle}
              </p>
            </div>
          ) : (
            currentTasks.map((task) => (
              <MobileTaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 relative h-full">
      {/* Render the TaskForm in a popup when editing a task */}
      {isFormVisible && (
        <TaskFormPopup
          userId={userId}
          initialTask={editingTask}
          onSubmit={() => setIsFormVisible(false)}
          onCancel={() => {
            setIsFormVisible(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {/* Render the ConfirmationDialog when needed */}
      {isConfirmationVisible && (
        <ConfirmationDialog
          message={confirmationMessage}
          onConfirm={() => {
            confirmationCallback();
            setIsConfirmationVisible(false);
          }}
          onCancel={() => setIsConfirmationVisible(false)}
        />
      )}

      {/* Conditionally render mobile or desktop view */}
      {isMobile ? (
        <MobileKanbanView />
      ) : (
        <div className="kanban-board">
          {/* Not Started Column */}
          <div
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "not_started")}
          >
            <div className="kanban-column-header bg-background flex items-center justify-between">
              <h3 className="text-foreground text-sm flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                To Do
              </h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-muted w-6 h-6 text-xs font-medium text-muted-foreground">
                  {notStartedTasks.length}
                </span>
                <button
                  onClick={handleAddButtonClick}
                  className="text-xs flex items-center gap-1 text-primary hover:text-primary-hover p-1 rounded-sm"
                  title="Add new task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add</span>
                </button>
              </div>
            </div>
            <div className="kanban-column-content">
              {isQuickTaskFormVisible && (
                <div className="mb-2 p-2 rounded-md glass-morphism animate-fade-in">
                  <form onSubmit={handleQuickTaskSubmit} className="relative">
                    <textarea
                      ref={textareaRef}
                      value={quickTaskTitle}
                      onChange={handleTextAreaChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (quickTaskTitle.trim() !== '') {
                            handleQuickTaskSubmit(e);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 pb-8 text-sm bg-background/50 outline-0 focus:outline-0 focus:ring-0 outline-none ring-0 resize-none rounded-lg backdrop-blur-sm"
                      placeholder="Enter task title..."
                      autoFocus
                      rows={2}
                    />
                    <div className="absolute bottom-4 right-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleQuickTaskCancel}
                        className="text-xs text-muted-foreground hover:text-muted-foreground-hover cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={quickTaskTitle.trim() === ""}
                        className="text-xs text-primary hover:text-primary-hover cursor-pointer px-2 py-1 rounded-sm bg-primary text-primary-foreground"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {notStartedTasks.length === 0 ? (
                <div
                  className="text-center p-4  rounded-md cursor-pointer border border-dashed border-border"
                  onClick={handleEmptyColumnClick}
                >
                  <p className="text-muted-foreground text-sm">
                    {emptyColumnMessages.not_started.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 trollr-text">
                    {emptyColumnMessages.not_started.subtitle}
                  </p>
                </div>
              ) : (
                notStartedTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="task-draggable"
                  >
                    <TaskCard
                      task={task}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setIsFormVisible(true);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "in_progress")}
          >
            <div className="kanban-column-header bg-background flex items-center justify-between">
              <h3 className="text-foreground text-sm flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                In Progress
              </h3>
              <span className="flex items-center justify-center rounded-full bg-muted w-6 h-6 text-xs font-medium text-muted-foreground">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="kanban-column-content">
              {inProgressTasks.length === 0 ? (
                <div className="text-center p-4 border border-dashed border-border rounded-md">
                  <p className="text-muted-foreground text-sm">
                    {emptyColumnMessages.in_progress.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 trollr-text">
                    {emptyColumnMessages.in_progress.subtitle}
                  </p>
                </div>
              ) : (
                inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="task-draggable"
                  >
                    <TaskCard
                      task={task}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setIsFormVisible(true);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Done Column */}
          <div
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "completed")}
          >
            <div className="kanban-column-header bg-background flex items-center justify-between">
              <h3 className="text-foreground text-sm flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Completed
              </h3>
              <span className="flex items-center justify-center rounded-full bg-muted w-6 h-6 text-xs font-medium text-muted-foreground">
                {doneTasks.length}
              </span>
            </div>
            <div className="kanban-column-content">
              {doneTasks.length === 0 ? (
                <div className="text-center p-4 border border-dashed border-border rounded-md">
                  <p className="text-muted-foreground text-sm">
                    {emptyColumnMessages.completed.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 trollr-text">
                    {emptyColumnMessages.completed.subtitle}
                  </p>
                </div>
              ) : (
                doneTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="task-draggable"
                  >
                    <TaskCard
                      task={task}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setIsFormVisible(true);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

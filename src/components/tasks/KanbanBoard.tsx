"use client";

import React, { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTaskStore } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { useLocalUser } from "@/context/LocalUserProvider";
import { usePomodoroStore } from "@/hooks/usePomodoro";
import { TaskFormPopup, ConfirmationDialog } from "./TaskPopups";

export const KanbanBoard: React.FC = () => {
  const { userId } = useLocalUser();
  const { getFilteredTasks, updateTask, addTask } = useTaskStore();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [isQuickTaskFormVisible, setIsQuickTaskFormVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationCallback, setConfirmationCallback] = useState<() => void>(() => {});

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
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
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
    </div>
  );
};

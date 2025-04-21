"use client";

import React, { useState, useEffect } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { useLocalUser } from "@/context/LocalUserProvider";
import { useTaskStore } from "@/hooks/useTasks";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { Task } from "@/types";

export interface NavbarPomodoroTimerProps {
  dockMode?: boolean;
}

export const NavbarPomodoroTimer: React.FC<NavbarPomodoroTimerProps> = ({
  dockMode = false,
}) => {
  const { userId, preferences } = useLocalUser();
  const {
    setDuration,
    setBreakDuration,
    progress,
    isActive,
    formattedTimeRemaining,
    isPaused,
    linkedTaskId,
    setLinkedTaskId,
    mode,
    shouldPlaySounds,
    shouldUseNotifications,
    toggleNotifications,
    toggleSounds,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
  } = usePomodoro();
  const taskStore = useTaskStore();
  const [showControls, setShowControls] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number | null>(
    null
  );

  // Update Pomodoro duration based on user preferences
  useEffect(() => {
    setDuration(preferences.pomodoroDuration);
    setBreakDuration(preferences.breakDuration);
  }, [
    preferences.pomodoroDuration,
    preferences.breakDuration,
    setDuration,
    setBreakDuration,
  ]);

  // Load active tasks when task selector is opened
  useEffect(() => {
    if (isTaskSelectorOpen) {
      const tasks = taskStore.getFilteredTasks({
        userId,
        status: ["not_started", "in_progress"],
      });
      setAvailableTasks(tasks);
    }
  }, [isTaskSelectorOpen, userId, taskStore]);

  // Modified to prevent toggling controls when in dock mode
  const toggleControls = () => {
    if (!dockMode) {
      setShowControls(!showControls);
    }
  };

  // Get the linked task if one exists
  const linkedTask = linkedTaskId ? taskStore.getTaskById(linkedTaskId) : null;

  // Format the time remaining with visual indication for active timers
  const getTimeDisplay = () => {
    const timeString = formattedTimeRemaining();
    if (isActive && !isPaused) {
      return (
        <div className="digital-clock-active">
          {timeString.split(":")[0]}
          <span className="digital-clock-separator blink">:</span>
          {timeString.split(":")[1]}
        </div>
      );
    }
    return (
      <div className="digital-clock">
        {timeString.split(":")[0]}
        <span className="digital-clock-separator">:</span>
        {timeString.split(":")[1]}
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center cursor-pointer ${
          dockMode ? "rounded px-2 py-1" : "px-4 py-2 rounded border"
        } ${
          isActive
            ? "border-primary bg-primary/5"
            : dockMode
            ? ""
            : "border-border bg-card"
        }`}
        onClick={toggleControls}
      >
        <div className="flex items-center">
          {isActive && (
            <div className={`${dockMode ? "mr-1.5" : "mr-2"}`}>
              <CircularProgress
                progress={progress()}
                size={dockMode ? 20 : 18}
                strokeWidth={2}
                className="text-foreground dark:text-white"
              />
            </div>
          )}
          <div
            className={`font-mono ${
              dockMode ? "text-sm font-medium" : "text-lg"
            }`}
          >
            {getTimeDisplay()}
          </div>
        </div>
        {linkedTask && (
          <div
            className={`text-sm ml-2 text-muted-foreground ${
              dockMode ? "text-xs flex-1" : ""
            }`}
            style={{ maxWidth: dockMode ? "196px" : "auto" }}
          >
            <span className="opacity-80">
              • {linkedTask.title.substring(0, dockMode ? 25 : 25)}
              {linkedTask.title.length > (dockMode ? 25 : 25) ? "..." : ""}
            </span>
          </div>
        )}

        {/* Controls removed from here as they've been moved to ProductivityDock */}
      </div>

      {showControls && (
        <div
          className={`absolute ${
            dockMode ? "top-0 left-full ml-2" : "top-full right-0 mt-2"
          } p-4 bg-card border border-border rounded shadow-lg z-10 w-80 animate-fade-in`}
        >
          <div className="text-center mb-4">
            <div className="text-sm text-muted-foreground">
              {mode === "work" ? "Focus Time" : "Break Time"}
            </div>
            <div className="flex justify-center items-center mt-1">
              {isActive && !isPaused && (
                <CircularProgress
                  progress={progress()}
                  size={60}
                  strokeWidth={4}
                  className="text-foreground dark:text-white"
                >
                  <div className="digital-clock text-xl font-mono">
                    {formattedTimeRemaining()}
                  </div>
                </CircularProgress>
              )}
              {(!isActive || isPaused) && (
                <div className="digital-clock text-2xl font-mono">
                  {formattedTimeRemaining()}
                </div>
              )}
            </div>
          </div>

          {/* Task linking section */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Current Focus:</div>
            {linkedTask ? (
              <div className="flex items-center justify-between">
                <div className="text-sm truncate flex-1">
                  {linkedTask.title}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkedTaskId(null);
                  }}
                  className="text-xs text-destructive hover:underline ml-2"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  No task linked
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTaskSelectorOpen(true);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Link a task
                </button>
              </div>
            )}
          </div>

          {/* Task selector dropdown */}
          {isTaskSelectorOpen && (
            <div className="mb-4 border border-border rounded-md p-2 bg-background/80 max-h-48 overflow-y-auto">
              <div className="font-medium text-sm mb-2">Select a task:</div>
              {availableTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No active tasks found
                </div>
              ) : (
                <ul className="space-y-1">
                  {availableTasks.map((task) => (
                    <li key={task.id}>
                      <button
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm flex justify-between items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLinkedTaskId(task.id);
                          setIsTaskSelectorOpen(false);
                        }}
                      >
                        <span className="truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {task.pomodoros.completed > 0
                            ? `${task.pomodoros.completed} done`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex justify-end">
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTaskSelectorOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {linkedTask && !isActive && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">
                Estimated pomodoros:
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={estimatedPomodoros || 1}
                  onChange={(e) =>
                    setEstimatedPomodoros(parseInt(e.target.value) || 1)
                  }
                  className="w-12 px-2 py-1 border border-border rounded text-sm"
                />
                <span className="text-xs ml-2 text-muted-foreground">
                  (about{" "}
                  {(estimatedPomodoros || 1) * preferences.pomodoroDuration}{" "}
                  minutes)
                </span>
              </div>
            </div>
          )}

          {/* Notification preferences */}
          <div className="flex justify-between text-xs mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={shouldPlaySounds}
                onChange={() => toggleSounds()}
                className="mr-1.5 h-3.5 w-3.5 rounded"
              />
              Sound
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={shouldUseNotifications}
                onChange={() => toggleNotifications()}
                className="mr-1.5 h-3.5 w-3.5 rounded"
              />
              Notifications
            </label>
          </div>

          {/* Timer controls */}
          <div className="flex justify-center gap-2">
            {!isActive ? (
              <button
                onClick={() => {
                  // Start Pomodoro with linked task if available
                  startSession(
                    userId,
                    linkedTaskId || undefined,
                    undefined, // Use default durations from preferences
                    undefined
                  );
                  setShowControls(false);
                }}
                className="btn-primary w-full py-2"
              >
                Start {linkedTaskId ? "Task" : "Focus"}
              </button>
            ) : !isPaused ? (
              <>
                <button
                  onClick={() => pauseSession()}
                  className="bg-muted text-foreground px-3 py-1.5 rounded text-sm flex-1"
                >
                  Pause
                </button>
                <button
                  onClick={() => {
                    stopSession(false);
                    setShowControls(false);
                  }}
                  className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-sm flex-1"
                >
                  Break
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => resumeSession()}
                  className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex-1"
                >
                  Resume Focus
                </button>
                <button
                  onClick={() => {
                    stopSession(false);
                    setShowControls(false);
                  }}
                  className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-sm flex-1"
                >
                  Break
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

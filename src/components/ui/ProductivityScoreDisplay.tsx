'use client';

import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { useLocalUser } from '@/context/LocalUserProvider';
import { useTaskStore } from '@/hooks/useTasks';

interface ProductivityScoreDisplayProps {
  showTrend?: boolean;
  showStreak?: boolean;
  size?: number;
  className?: string;
}

export function ProductivityScoreDisplay({
  showTrend = true,
  showStreak = true,
  size = 120,
  className = '',
}: ProductivityScoreDisplayProps) {
  const { 
    stats, 
    productivityScore, 
    checkAndUpdateStreak,
    updateStats
  } = useLocalUser();
  
  // Listen to task store changes to immediately update the score
  const tasks = useTaskStore(state => state.tasks);
  
  // Use this state to force re-render when tasks change
  const [localScore, setLocalScore] = useState<number>(productivityScore);
  
  const [previousScore, setPreviousScore] = useState<number>(productivityScore);
  const [scoreDirection, setScoreDirection] = useState<'up' | 'down' | 'same'>('same');
  const [animateScore, setAnimateScore] = useState<boolean>(false);
  
  // Simplified monochrome palette - no colors
  const getScoreColor = (score: number) => {
    return 'currentColor'; // Use currentColor to respect the text color in light/dark mode
  };
  
  // Update local score when productivityScore changes
  useEffect(() => {
    setLocalScore(productivityScore);
  }, [productivityScore]);
  
  // Recalculate score when tasks are completed
  useEffect(() => {
    // Count completed and overdue tasks
    const completedTasks = tasks.filter(task => 
      task.status === 'completed').length;
    const overdueTasks = tasks.filter(task => 
      task.status === 'overdue').length;
    
    // Only update if we have tasks and the counts differ from current stats
    if (tasks.length > 0 && 
        (completedTasks !== stats.tasksCompleted || 
         overdueTasks !== stats.tasksOverdue)) {
      
      // Update stats
      updateStats({
        tasksCompleted: completedTasks,
        tasksOverdue: overdueTasks
      });
      
      // Force immediate update in UI
      const totalTasks = completedTasks + overdueTasks;
      const completionRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0.5;
      const pomodoroRatio = stats.pomodorosCompleted > 0 ? 
        (stats.pomodorosCompleted / (stats.pomodorosCompleted + stats.pomodorosAbandoned)) : 0.5;
      const streakBonus = Math.min(stats.currentStreak * 2, 20);
      
      const newScore = Math.min(
        Math.max(
          Math.round((completionRatio * 40) + (pomodoroRatio * 40) + streakBonus),
          0
        ),
        100
      );
      
      setLocalScore(newScore);
    }
  }, [tasks, stats, updateStats]);
  
  // Check for score changes
  useEffect(() => {
    if (previousScore !== localScore) {
      setScoreDirection(localScore > previousScore ? 'up' : 'down');
      setAnimateScore(true);
      setPreviousScore(localScore);
      
      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setAnimateScore(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [localScore, previousScore]);
  
  useEffect(() => {
    checkAndUpdateStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Calculate a proportional font size
  const fontSize = Math.max(Math.round(size / 4), 14);
  
  // Minimalistic trend indicator
  const renderTrendIndicator = () => {
    if (!showTrend) return null;
    
    return (
      <span 
        className={`absolute -bottom-1 -right-1 opacity-60 ${
          animateScore ? 'opacity-100' : ''
        } ${
          scoreDirection === 'up' 
            ? 'text-emerald-500' 
            : scoreDirection === 'down' 
              ? 'text-slate-400' 
              : 'text-transparent'
        }`}
        style={{ fontSize: `${Math.max(fontSize * 0.4, 12)}px` }}
      >
      </span>
    );
  };
  
  // Minimalistic streak display - only for significant streaks (3+)
  const renderStreakIndicator = () => {
    if (!showStreak || stats.currentStreak < 3) return null;
    
    return (
      <div className="absolute -top-1 -right-1 flex items-center justify-center">
        <span className="inline-flex items-center justify-center rounded-full bg-slate-700/50 dark:bg-slate-900/50 px-1.5 py-0.5 text-[10px] text-slate-300">
          {stats.currentStreak}d
        </span>
      </div>
    );
  };
  
  return (
    <div className={`relative ${className}`}>
      <CircularProgress
        progress={localScore}
        size={size}
        color={getScoreColor(localScore)}
        backgroundColor="currentColor" 
        strokeWidth={Math.max(Math.round(size / 16), 2)} // Thinner stroke
        monochrome={true} // Ensure monochrome theme is used
      >
        <div className="flex flex-col items-center justify-center">
          <span 
            className={`font-medium transition-all duration-300 ${
              animateScore ? 'scale-105' : ''
            }`}
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: 1
            }}
          >
            {localScore}
          </span>
        </div>
      </CircularProgress>
      
      {renderTrendIndicator()}
      {renderStreakIndicator()}
    </div>
  );
}
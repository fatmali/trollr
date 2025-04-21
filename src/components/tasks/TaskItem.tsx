'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Task, TaskPriority } from '@/types';
import { useLocalUser } from '@/context/LocalUserProvider';
import { ConfettiEffect } from '@/components/ui/ConfettiEffect';

interface TaskItemProps {
  task: Task;
  onStartPomodoro: (task: Task) => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onStartPomodoro,
  onComplete,
  onDelete,
  onEdit,
}) => {
  const { updateAchievementProgress, addReward, productivityScore } = useLocalUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const [commitmentState, setCommitmentState] = useState<'idle' | 'committing' | 'committed'>('idle');
  
  // Function to get appropriate card variant based on task priority
  const getCardVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'priority.high';
      case 'medium':
        return 'priority.medium';
      case 'low':
        return 'priority.low';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
  };

  // Check if task's deadline is approaching (within 24 hours)
  const isDeadlineApproaching = () => {
    if (!task.deadline || task.status === 'completed') return false;
    const deadlineDate = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 24;
  };

  // Handle task completion with behavioral reinforcement
  const handleCompleteTask = () => {
    // Show confetti celebration
    setShowConfetti(true);
    
    // Complete the task
    onComplete(task);
    
    // Check for achievements
    updateAchievementProgress('first_task', 1);
    
    // Check if the task was overdue for more than 2 days
    if (isOverdue() && task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      const diffTime = now.getTime() - deadlineDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays > 2) {
        updateAchievementProgress('comeback_kid', 1);
        addReward('quote', "Better late than never! You completed an overdue task. Keep going!", { taskId: task.id });
      }
    }
    
    // Variable reward based on productivity score and randomness
    // Lower scores get more rewarding feedback to encourage improvement
    const shouldGiveReward = Math.random() < (0.7 - (productivityScore / 200));
    
    if (shouldGiveReward) {
      const rewardMessages = [
        "🔥 Task crushed! Your brain's not completely useless after all.",
        "✅ Fine, I'll admit it: that was actually impressive.",
        "🎯 Task completed! Should I pretend to be shocked that you finished something?",
        "🚀 Look at you being all productive and stuff. Weird flex but ok.",
        "💪 Another one down! Maybe you're not as hopeless as you look."
      ];
      
      const randomIndex = Math.floor(Math.random() * rewardMessages.length);
      addReward('confetti', rewardMessages[randomIndex], { taskId: task.id });
    }
  };
  
  // Implementing micro-commitment for starting Pomodoro
  const handleStartPomodoro = () => {
    if (commitmentState === 'idle') {
      setCommitmentState('committing');
      return;
    }
    
    if (commitmentState === 'committing') {
      setCommitmentState('committed');
      onStartPomodoro(task);
      
      // Progress on pomodoro achievement
      updateAchievementProgress('pomodoro_5', 1);
    }
  };
  
  // Generate commitment message that creates friction when starting task
  const getCommitmentMessage = () => {
    if (commitmentState === 'committing') {
      const messages = [
        "Are you ACTUALLY going to focus this time?",
        "Promise you won't abandon this one too?",
        "Pinky swear you'll stick with it for 25 minutes?",
        "Last time you quit after 5 minutes. Ready to commit?"
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    return null;
  };

  return (
    <Card 
      variant={getCardVariant(task.priority)} 
      className={`mb-4 transition-all duration-200 hover:shadow-md ${
        task.status === 'completed' ? 'opacity-75' : ''
      } ${isOverdue() ? 'border-red-500 border-opacity-50' : ''}
      ${isDeadlineApproaching() ? 'border-yellow-500 border-opacity-50' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
            {task.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {task.status === 'completed' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                Completed
              </span>
            )}
            {isOverdue() && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 animate-pulse">
                Overdue
              </span>
            )}
            {isDeadlineApproaching() && !isOverdue() && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                Due Soon
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {task.priority}
            </span>
          </div>
        </div>
        <CardDescription>
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p>Created: {formatDate(task.createdAt)}</p>
          {task.deadline && <p>Deadline: {formatDate(task.deadline)}</p>}
          {task.completedAt && <p>Completed: {formatDate(task.completedAt)}</p>}
          {task.codeSnippet && (
            <div className="mt-2 p-2 bg-gray-800 text-gray-200 rounded overflow-x-auto font-mono text-xs">
              <pre>{task.codeSnippet}</pre>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Pomodoros:</span>
            {task.pomodoros.completed > 0 ? (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {task.pomodoros.completed} completed
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-500">No pomodoros yet</span>
            )}
            {task.pomodoros.abandoned > 0 && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                {task.pomodoros.abandoned} abandoned
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onEdit(task)}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(task)}
          >
            Delete
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {commitmentState === 'committing' && (
            <div className="text-xs text-amber-500 dark:text-amber-400 mb-1 text-right">
              {getCommitmentMessage()}
            </div>
          )}
          <div className="flex gap-2">
            {task.status !== 'completed' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleStartPomodoro}
                  className={commitmentState === 'committing' ? 'border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600' : ''}
                >
                  {commitmentState === 'committing' ? 'I Promise' : 'Start Pomodoro'}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleCompleteTask}
                  className="relative overflow-hidden"
                >
                  <span className={task.pomodoros.completed > 0 ? "mr-1" : ""}>Complete</span>
                  {task.pomodoros.completed > 0 && (
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-white/20 text-[10px]">
                      +{task.pomodoros.completed}
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardFooter>
      
      {/* Celebratory confetti effect when completing tasks */}
      <ConfettiEffect 
        showConfetti={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        type={isOverdue() ? 'streak' : 'success'}
      />
    </Card>
  );
};
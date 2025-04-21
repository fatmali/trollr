// Task-related types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  codeSnippet?: string;
  createdAt: string;
  deadline?: string;
  completedAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  pomodoros: {
    completed: number;
    abandoned: number;
  };
}

// User-related types
export interface User {
  id: string;
  createdAt: string;
  displayName: string;
  preferences: {
    trollIntensity: number; // 1-10 scale
    pomodoroDuration: number;
    breakDuration: number;
    lofiEnabled?: boolean;
    lofiVolume?: number;
    lofiStation?: string;
  };
  stats: {
    tasksCompleted: number;
    tasksOverdue: number;
    averageCompletionTime: number;
    pomodorosCompleted: number;
    pomodorosAbandoned: number;
    currentStreak: number;         // Days in a row with completed tasks
    longestStreak: number;         // Longest streak ever achieved
    lastActiveDate?: string;       // Used for streak calculation
    productivityScore: number;     // 0-100 scale
    consistencyScore: number;      // 0-100 scale
  };
  achievements: Achievement[];
  rewardHistory: Reward[];
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: 'trophy' | 'medal' | 'star' | 'fire' | 'sparkles';
  unlockedAt?: string;
  category: 'streak' | 'task' | 'pomodoro' | 'troll_interaction';
  progress: number;            // Current progress (e.g., 3/5 tasks)
  target: number;              // Target to achieve (e.g., 5 tasks)
  secret?: boolean;            // Whether to hide details until unlocked
}

// Reward system for variable reinforcement
export interface Reward {
  id: string;
  type: 'confetti' | 'badge' | 'quote' | 'theme_unlock' | 'feature_unlock';
  content: string;
  receivedAt: string;
  dismissedAt?: string;
  associatedTaskId?: string;
  associatedAchievementId?: string;
}

// Pomodoro-related types
export type PomodoroStatus = 'completed' | 'abandoned' | 'in_progress';

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId?: string;
  startedAt: string;
  scheduledEndAt: string;
  actualEndAt?: string;
  status: PomodoroStatus;
  interruptions: number;
}

// Trollr message types
export type TrollTriggerType = 
  'deadline_approaching' | 
  'overdue' | 
  'inactivity' | 
  'pomodoro_abandoned' | 
  'excuse_response' | 
  'completion';

export interface TrollMessage {
  id: string;
  userId: string;
  taskId?: string;
  content: string;
  triggerType: TrollTriggerType;
  severity: number; // 1-5 scale for UI presentation
  createdAt: string;
  readAt?: string;
  userReaction?: 'helpful' | 'funny' | 'annoying';
}

// MCP (Model Context Protocol) types
export interface MCPContext {
  userData: {
    id: string;
    displayName: string;
    workHabits: string[];
    commonExcuses: string[];
    productivityPatterns: string[];
    stats: User['stats'];
  };
  taskData?: {
    id: string;
    title: string;
    description: string;
    deadline?: string;
    priority: TaskPriority;
    createdAt: string;
    completionRate: number;
  };
  timeData: {
    timeOfDay: string;
    dayOfWeek: string;
    elapsedTimeSinceTaskCreation?: number;
  };
  historicalData?: {
    postponedTasks: Array<{
      title: string;
      postponeCount: number;
    }>;
    abandonedPomodoros: number;
  };
}

export interface MCPResponse {
  message: string;
  severity: number;
  actionSuggestion?: string;
}
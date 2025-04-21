"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { User, Achievement, Reward } from "@/types";

interface LocalUserContextType {
  userId: string;
  displayName: string;
  setDisplayName: (name: string) => void;
  preferences: {
    trollIntensity: number;
    pomodoroDuration: number;
    breakDuration: number;
    lofiEnabled?: boolean;
    lofiVolume?: number;
    lofiStation?: string;
  };
  updatePreferences: (preferences: Partial<User["preferences"]>) => void;
  stats: User["stats"];
  updateStats: (stats: Partial<User["stats"]>) => void;
  achievements: Achievement[];
  checkAndUpdateStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  addReward: (
    type: Reward["type"],
    content: string,
    associatedIds?: { taskId?: string; achievementId?: string }
  ) => void;
  rewards: Reward[];
  dismissReward: (rewardId: string) => void;
  productivityScore: number; // Computed from stats
}

// Default values for context
const defaultUserStats: User["stats"] = {
  tasksCompleted: 0,
  tasksOverdue: 0,
  averageCompletionTime: 0,
  pomodorosCompleted: 0,
  pomodorosAbandoned: 0,
  currentStreak: 0,
  longestStreak: 0,
  productivityScore: 50, // Start at neutral
  consistencyScore: 50, // Start at neutral
};

const defaultUserPreferences: User["preferences"] = {
  trollIntensity: 5, // Medium intensity by default (1-10 scale)
  pomodoroDuration: 25, // 25 minutes by default
  breakDuration: 5, // 5 minutes by default
};

// Default achievements to track
const defaultAchievements: Achievement[] = [
  {
    id: "first_task",
    name: "First Blood",
    description: "Complete your first task. We all start somewhere!",
    iconType: "trophy",
    category: "task",
    progress: 0,
    target: 1,
  },
  {
    id: "streak_3",
    name: "Consistency is Key",
    description: "Maintain a 3-day productivity streak",
    iconType: "fire",
    category: "streak",
    progress: 0,
    target: 3,
  },
  {
    id: "pomodoro_5",
    name: "Focus Master",
    description: "Complete 5 Pomodoro sessions without abandoning",
    iconType: "medal",
    category: "pomodoro",
    progress: 0,
    target: 5,
  },
  {
    id: "troll_friend",
    name: "Trollr Whisperer",
    description: "React positively to 10 trollr messages",
    iconType: "sparkles",
    category: "troll_interaction",
    progress: 0,
    target: 10,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Complete a task that was overdue for more than 2 days",
    iconType: "star",
    category: "task",
    progress: 0,
    target: 1,
    secret: true,
  },
];

const LocalUserContext = createContext<LocalUserContextType | null>(null);

export function LocalUserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("Developer");
  const [preferences, setPreferences] = useState<User["preferences"]>(
    defaultUserPreferences
  );
  const [stats, setStats] = useState<User["stats"]>(defaultUserStats);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [productivityScore, setProductivityScore] = useState<number>(50);

  const updateStats = useCallback((newStats: Partial<User["stats"]>) => {
    const updatedStats = { ...stats, ...newStats };
    localStorage.setItem("troll_stats", JSON.stringify(updatedStats));
    setStats(updatedStats);
  }, [stats]);

  // Calculate productivity score based on stats
  useEffect(() => {
    if (userId) {
      const calculateProductivityScore = () => {
        // Base score from task completion ratio
        const totalTasks = stats.tasksCompleted + stats.tasksOverdue;
        const completionRatio =
          totalTasks > 0 ? stats.tasksCompleted / totalTasks : 0.5;

        // Base score from pomodoro success ratio
        const totalPomodoros =
          stats.pomodorosCompleted + stats.pomodorosAbandoned;
        const pomodoroRatio =
          totalPomodoros > 0 ? stats.pomodorosCompleted / totalPomodoros : 0.5;

        // Weight completion higher with streaks
        const streakBonus = Math.min(stats.currentStreak * 2, 20); // Max 20% bonus

        // Calculate weighted score (0-100)
        const newScore = Math.min(
          Math.max(
            Math.round(completionRatio * 40 + pomodoroRatio * 40 + streakBonus),
            0
          ),
          100
        );

        setProductivityScore(newScore);

        // Update the stats with new productivity score
        updateStats({ productivityScore: newScore });
      };

      calculateProductivityScore();
    }
  }, [
    stats.tasksCompleted,
    stats.tasksOverdue,
    stats.pomodorosCompleted,
    stats.pomodorosAbandoned,
    stats.currentStreak,
    userId,
    updateStats,
  ]);

  // Check streak once per day
  const checkAndUpdateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    const lastActive = stats.lastActiveDate;

    if (!lastActive) {
      // First time user is active
      updateStats({
        lastActiveDate: today,
        currentStreak: 1,
        longestStreak: 1,
      });
      return;
    }

    const lastActiveDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day, increase streak
      const newStreakValue = stats.currentStreak + 1;
      const newLongestStreak = Math.max(newStreakValue, stats.longestStreak);

      updateStats({
        lastActiveDate: today,
        currentStreak: newStreakValue,
        longestStreak: newLongestStreak,
      });

      // Check for streak achievements
      achievements.forEach((achievement) => {
        if (achievement.category === "streak" && !achievement.unlockedAt) {
          if (newStreakValue >= achievement.target) {
            unlockAchievement(achievement.id);

            // Add a reward for significant streaks
            if (achievement.target >= 3) {
              addReward(
                "confetti",
                `🔥 ${newStreakValue} day streak! Keep the momentum going!`,
                { achievementId: achievement.id }
              );
            }
          } else {
            updateAchievementProgress(achievement.id, newStreakValue);
          }
        }
      });
    } else if (diffDays > 1) {
      // Streak broken
      updateStats({
        lastActiveDate: today,
        currentStreak: 1,
      });
    } else {
      // Same day, just update the date
      updateStats({ lastActiveDate: today });
    }
  };

  // Achievement management
  const unlockAchievement = (achievementId: string) => {
    setAchievements((current) =>
      current.map((achievement) =>
        achievement.id === achievementId
          ? {
              ...achievement,
              unlockedAt: new Date().toISOString(),
              progress: achievement.target,
            }
          : achievement
      )
    );

    // Save to localStorage
    const updatedAchievements = achievements.map((achievement) =>
      achievement.id === achievementId
        ? {
            ...achievement,
            unlockedAt: new Date().toISOString(),
            progress: achievement.target,
          }
        : achievement
    );

    localStorage.setItem(
      "troll_achievements",
      JSON.stringify(updatedAchievements)
    );

    // Add a reward for the achievement
    addReward(
      "badge",
      `Achievement Unlocked: ${
        achievements.find((a) => a.id === achievementId)?.name
      }`,
      { achievementId }
    );
  };

  const updateAchievementProgress = (
    achievementId: string,
    progress: number
  ) => {
    const achievement = achievements.find((a) => a.id === achievementId);
    if (!achievement || achievement.unlockedAt) return; // Don't update if already unlocked

    setAchievements((current) =>
      current.map((a) =>
        a.id === achievementId
          ? { ...a, progress: Math.min(progress, a.target) }
          : a
      )
    );

    // Save to localStorage
    const updatedAchievements = achievements.map((a) =>
      a.id === achievementId
        ? { ...a, progress: Math.min(progress, a.target) }
        : a
    );

    localStorage.setItem(
      "troll_achievements",
      JSON.stringify(updatedAchievements)
    );

    // Check if the achievement is now complete
    if (progress >= achievement.target) {
      unlockAchievement(achievementId);
    }
  };

  // Rewards management
  const addReward = (
    type: Reward["type"],
    content: string,
    associatedIds?: { taskId?: string; achievementId?: string }
  ) => {
    const newReward: Reward = {
      id: uuidv4(),
      type,
      content,
      receivedAt: new Date().toISOString(),
      ...(associatedIds?.taskId && { associatedTaskId: associatedIds.taskId }),
      ...(associatedIds?.achievementId && {
        associatedAchievementId: associatedIds.achievementId,
      }),
    };

    setRewards((current) => [newReward, ...current]);

    // Save to localStorage
    const updatedRewards = [newReward, ...rewards];
    localStorage.setItem("troll_rewards", JSON.stringify(updatedRewards));

    return newReward;
  };

  const dismissReward = (rewardId: string) => {
    setRewards((current) =>
      current.map((reward) =>
        reward.id === rewardId
          ? { ...reward, dismissedAt: new Date().toISOString() }
          : reward
      )
    );

    // Save to localStorage
    const updatedRewards = rewards.map((reward) =>
      reward.id === rewardId
        ? { ...reward, dismissedAt: new Date().toISOString() }
        : reward
    );

    localStorage.setItem("troll_rewards", JSON.stringify(updatedRewards));
  };

  useEffect(() => {
    // Check for existing ID in localStorage or create new one
    const existingId = localStorage.getItem("troll_user_id");
    if (existingId) {
      setUserId(existingId);
    } else {
      const newId = uuidv4();
      localStorage.setItem("troll_user_id", newId);
      setUserId(newId);
    }

    // Load display name if exists
    const savedName = localStorage.getItem("troll_display_name");
    if (savedName) {
      setDisplayName(savedName);
    }

    // Load preferences if exists
    const savedPreferences = localStorage.getItem("troll_preferences");
    if (savedPreferences) {
      try {
        setPreferences({
          ...defaultUserPreferences,
          ...JSON.parse(savedPreferences),
        });
      } catch (error) {
        console.error("Failed to parse saved preferences", error);
      }
    }

    // Load stats if exists
    const savedStats = localStorage.getItem("troll_stats");
    if (savedStats) {
      try {
        setStats({ ...defaultUserStats, ...JSON.parse(savedStats) });
      } catch (error) {
        console.error("Failed to parse saved stats", error);
      }
    }

    // Load achievements or initialize with defaults
    const savedAchievements = localStorage.getItem("troll_achievements");
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (error) {
        console.error("Failed to parse saved achievements", error);
        setAchievements(defaultAchievements);
      }
    } else {
      setAchievements(defaultAchievements);
      localStorage.setItem(
        "troll_achievements",
        JSON.stringify(defaultAchievements)
      );
    }

    // Load rewards if exists
    const savedRewards = localStorage.getItem("troll_rewards");
    if (savedRewards) {
      try {
        setRewards(JSON.parse(savedRewards));
      } catch (error) {
        console.error("Failed to parse saved rewards", error);
        setRewards([]);
      }
    }

    // Check streak on initial load
    const checkInitialStreak = () => {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = savedStats
        ? JSON.parse(savedStats).lastActiveDate
        : null;

      if (!lastActive) {
        // First time user is active
        const updatedStats = {
          ...defaultUserStats,
          lastActiveDate: today,
          currentStreak: 1,
          longestStreak: 1,
        };
        localStorage.setItem("troll_stats", JSON.stringify(updatedStats));
        setStats(updatedStats);
      }
    };

    checkInitialStreak();
  }, []);

  const updateDisplayName = (name: string) => {
    localStorage.setItem("troll_display_name", name);
    setDisplayName(name);
  };

  const updatePreferences = (newPreferences: Partial<User["preferences"]>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    localStorage.setItem(
      "troll_preferences",
      JSON.stringify(updatedPreferences)
    );
    setPreferences(updatedPreferences);
  };

  return (
    <LocalUserContext.Provider
      value={{
        userId,
        displayName,
        setDisplayName: updateDisplayName,
        preferences,
        updatePreferences,
        stats,
        updateStats,
        achievements,
        checkAndUpdateStreak,
        unlockAchievement,
        updateAchievementProgress,
        addReward,
        rewards,
        dismissReward,
        productivityScore,
      }}
    >
      {children}
    </LocalUserContext.Provider>
  );
}

export const useLocalUser = () => {
  const context = useContext(LocalUserContext);
  if (context === null) {
    throw new Error("useLocalUser must be used within a LocalUserProvider");
  }
  return context;
};

'use client';

import React, { useState, useEffect } from 'react';
import { useLocalUser } from '@/context/LocalUserProvider';
import { Achievement, Reward } from '@/types';

export function AchievementsDisplay() {
  const { achievements } = useLocalUser();
  const [displayAchievements, setDisplayAchievements] = useState<Achievement[]>([]);
  
  useEffect(() => {
    // Only show non-secret achievements or those that are unlocked
    setDisplayAchievements(
      achievements.filter(a => !a.secret || a.unlockedAt)
    );
  }, [achievements]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Your Achievements</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
      
      {displayAchievements.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400">No achievements yet. Keep trolling!</p>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  const progressPercentage = Math.min(
    Math.round((achievement.progress / achievement.target) * 100), 
    100
  );
  
  // Get icon based on type
  const renderIcon = () => {
    switch (achievement.iconType) {
      case 'trophy':
        return '🏆';
      case 'medal':
        return '🥇';
      case 'star':
        return '⭐';
      case 'fire':
        return '🔥';
      case 'sparkles':
        return '✨';
      default:
        return '🎯';
    }
  };
  
  return (
    <div 
      className={`relative border rounded-lg p-3 transition-all ${
        isUnlocked 
          ? 'border-indigo-400 bg-indigo-950/40' 
          : 'border-gray-700 bg-gray-800/40'
      }`}
    >
      {isUnlocked && (
        <span className="absolute top-2 right-2 text-xs font-bold text-indigo-400">
          Unlocked!
        </span>
      )}
      
      <div className="flex items-start space-x-3">
        <div className="text-xl sm:text-2xl">{renderIcon()}</div>
        <div>
          <h4 className="font-bold">{achievement.name}</h4>
          <p className="text-sm text-gray-400">{achievement.description}</p>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isUnlocked ? 'bg-indigo-500' : 'bg-gray-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{achievement.progress} / {achievement.target}</span>
          <span>{progressPercentage}%</span>
        </div>
      </div>
    </div>
  );
}

export function RewardsDisplay() {
  const { rewards, dismissReward } = useLocalUser();
  const [activeRewards, setActiveRewards] = useState<Reward[]>([]);
  
  useEffect(() => {
    // Only show non-dismissed rewards, newest first
    setActiveRewards(
      rewards
        .filter(r => !r.dismissedAt)
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
        .slice(0, 5) // Only show 5 most recent
    );
  }, [rewards]);
  
  if (activeRewards.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
      {activeRewards.map((reward) => (
        <RewardNotification 
          key={reward.id} 
          reward={reward} 
          onDismiss={() => dismissReward(reward.id)} 
        />
      ))}
    </div>
  );
}

function RewardNotification({ 
  reward, 
  onDismiss 
}: { 
  reward: Reward; 
  onDismiss: () => void 
}) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation to complete
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  // Get style based on reward type
  const getTypeStyles = () => {
    switch (reward.type) {
      case 'confetti':
        return 'bg-gradient-to-r from-green-600 to-teal-600 border-green-500';
      case 'badge':
        return 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-500';
      case 'quote':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500';
      case 'theme_unlock':
      case 'feature_unlock':
        return 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-500';
      default:
        return 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600';
    }
  };
  
  // Get icon based on reward type
  const getIcon = () => {
    switch (reward.type) {
      case 'confetti':
        return '🎉';
      case 'badge':
        return '🏅';
      case 'quote':
        return '💬';
      case 'theme_unlock':
        return '🎨';
      case 'feature_unlock':
        return '🎁';
      default:
        return '✨';
    }
  };
  
  return (
    <div 
      className={`
        border rounded-lg shadow-lg p-3 
        transform transition-all duration-300
        ${getTypeStyles()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="text-xl mr-2">{getIcon()}</div>
        <div className="flex-1">
          <p className="text-white font-medium">{reward.content}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-white/80 hover:text-white ml-2"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
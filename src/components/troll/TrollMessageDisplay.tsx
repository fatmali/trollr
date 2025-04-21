'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { TrollMessage } from '@/types';
import { useTrollMessages } from '@/hooks/useTrollMessages';
import { useLocalUser } from '@/context/LocalUserProvider';

export const TrollMessageDisplay: React.FC = () => {
  const { userId, displayName, updateAchievementProgress, productivityScore } = useLocalUser();
  const { messages, getUnreadMessages, markAsRead, addReaction } = useTrollMessages();
  const [currentMessage, setCurrentMessage] = useState<TrollMessage | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [previousReactions, setPreviousReactions] = useState<Record<string, number>>({
    helpful: 0,
    funny: 0,
    annoying: 0
  });
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Funny reaction tooltips
  const reactionTooltips = {
    helpful: [
      "Thanks Captain Obvious", 
      "Fine, I'll listen this time", 
      "Much wisdom, such wow",
      "I begrudgingly acknowledge your point"
    ],
    funny: [
      "Har har, hilarious", 
      "Actual LOL", 
      "Comedy gold, please continue",
      "I'm keeping screenshots of these"
    ],
    annoying: [
      "Go back to your bridge", 
      "Who invited this guy?", 
      "Unsubscribe",
      "Will this make you go away?"
    ]
  };

  // Get random tooltip for each reaction type
  const getRandomTooltip = (type: 'helpful' | 'funny' | 'annoying') => {
    const options = reactionTooltips[type];
    return options[Math.floor(Math.random() * options.length)];
  };
  
  // Count previous reactions (for personalization)
  useEffect(() => {
    const countReactions = () => {
      const counts = { helpful: 0, funny: 0, annoying: 0 };
      
      messages.forEach(message => {
        if (message.userReaction && message.userId === userId) {
          counts[message.userReaction]++;
        }
      });
      
      setPreviousReactions(counts);
    };
    
    countReactions();
  }, [messages, userId]);
  
  // Check for unread messages
  useEffect(() => {
    const unreadMessages = getUnreadMessages(userId);
    
    if (unreadMessages.length > 0 && !currentMessage) {
      // Get the most recent unread message
      const latestMessage = unreadMessages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      setCurrentMessage(latestMessage);
      setDisplayedText('');
      setIsTyping(true);
      setIsVisible(true);
    }
  }, [messages, userId, getUnreadMessages, currentMessage]);
  
  // Handle typing animation effect with variable speeds based on severity
  useEffect(() => {
    if (currentMessage && isTyping) {
      const text = currentMessage.content;
      let currentIndex = 0;
      
      // Clear any existing typing timer
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      
      // Typing speed varies based on severity - creates emotional impact
      // Higher severity = faster & more urgent typing
      const typingSpeed = currentMessage.severity >= 4 ? 20 : 
                          currentMessage.severity === 3 ? 30 : 40;
      
      // Start typing animation
      typingTimerRef.current = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingTimerRef.current as NodeJS.Timeout);
          
          // Mark message as read after it's fully displayed
          if (currentMessage) {
            markAsRead(currentMessage.id);
          }
          
          // Clear any existing dismiss timer
          if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
          }
          
          // Auto-dismiss after variable time based on message length and severity
          // This creates unpredictability (variable rewards principle)
          const baseTime = 6000; // Base 6 seconds
          const lengthFactor = Math.min(text.length / 10, 8) * 1000; // Up to 8 more seconds based on length
          const severityFactor = (6 - currentMessage.severity) * 1000; // Lower severity = longer display
          const dismissTime = baseTime + lengthFactor + severityFactor;
          
          dismissTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setCurrentMessage(null), 300); // Wait for fade-out transition
          }, dismissTime);
        }
      }, typingSpeed);
      
      return () => {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
        }
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
      };
    }
  }, [currentMessage, isTyping, markAsRead]);
  
  // Handle dismiss
  const handleDismiss = () => {
    // Clear auto-dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    
    setIsVisible(false);
    setTimeout(() => setCurrentMessage(null), 300); // Wait for fade-out transition
  };
  
  // Handle reaction with achievement tracking
  const handleReaction = (reaction: 'helpful' | 'funny' | 'annoying') => {
    if (currentMessage) {
      addReaction(currentMessage.id, reaction);
      
      // Progress troll interaction achievement for positive reactions
      if (reaction === 'helpful' || reaction === 'funny') {
        updateAchievementProgress('troll_friend', 1);
      }
      
      // Personalize future messages based on reactions (psychological hook)
      // This happens in the background via the stats
      setPreviousReactions(prev => ({
        ...prev,
        [reaction]: prev[reaction] + 1
      }));
      
      handleDismiss();
    }
  };
  
  // Get appropriate background color based on message severity
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return 'bg-[#e6f5eb] dark:bg-[#1f3329] border-primary dark:border-primary';
      case 2:
        return 'bg-[#e6f5eb] dark:bg-[#1f3329] border-primary dark:border-primary';
      case 3:
        return 'bg-[#fff4e4] dark:bg-[#2d2110] border-[#f9c74f] dark:border-[#f9c74f]';
      case 4:
        return 'bg-[#ffede9] dark:bg-[#2d1814] border-[#e63946] dark:border-[#e63946]';
      case 5:
        return 'bg-[#ffede9] dark:bg-[#2d1814] border-[#e63946] dark:border-[#e63946]';
      default:
        return 'bg-[#e6f5eb] dark:bg-[#1f3329] border-primary dark:border-primary';
    }
  };

  // Animation variants for the troll message - psychological impact increases with severity
  const getAnimationClass = (severity: number) => {
    if (severity >= 5) return 'animate-bounce-small animate-wiggle';
    if (severity >= 4) return 'animate-wiggle';
    if (severity >= 3) return 'animate-pulse';
    return '';
  };

  // Get troll titles based on severity and user's productivity
  // This creates a sense of progression and relationship with the character
  const getTrollTitle = (severity: number) => {
    // Base titles
    const baseTitles = [
      "Troll Assistant",
      "Troll Buddy",
      "Troll Coach",
      "Troll Overlord",
      "TROLL TASKMASTER"
    ];
    
    // For users with very high productivity, give respectful titles
    if (productivityScore >= 80) {
      return severity >= 4 
        ? "Troll (Actually Impressed)" 
        : "Troll (Reluctantly Respectful)";
    }
    
    // For users with lots of "annoying" reactions, make troll more confrontational
    if (previousReactions.annoying > 5) {
      return severity >= 4 
        ? "Troll (Extra Spicy)" 
        : "Troll (Not Backing Down)";
    }
    
    // For users with lots of "funny" reactions, make troll more humor-focused
    if (previousReactions.funny > 5) {
      return "Troll (Comedy Tour)";
    }
    
    // Default behavior
    return baseTitles[Math.min(severity - 1, 4)];
  };
  
  // Customize which reaction buttons to highlight based on user's history
  // This creates a sense of relationship and personalization
  const getReactionHighlight = (type: 'helpful' | 'funny' | 'annoying') => {
    const mostUsed = Object.entries(previousReactions)
      .sort((a, b) => b[1] - a[1])[0][0];
      
    if (type === mostUsed && previousReactions[mostUsed] > 3) {
      return 'border-primary/70 bg-primary/5';
    }
    
    return 'border-primary/30';
  };
  
  // No message to display or it's hidden
  if (!currentMessage || !isVisible) {
    return null;
  }
  
  return (
    <div 
      className={`fixed top-6 right-6 max-w-xs w-full p-4 z-50 rounded-lg shadow-troll border-l-4 ${getSeverityColor(currentMessage.severity)} transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'} ${getAnimationClass(currentMessage.severity)}`}
    >
      <div className="flex justify-between items-center">
        <h3 className={`text-sm flex items-center gap-2 ${currentMessage.severity >= 4 ? 'troll-text' : 'font-medium text-primary'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={currentMessage.severity >= 4 ? 'text-destructive' : 'text-primary'}>
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5-1.35C8.47 21.51 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"></path>
          </svg>
          {getTrollTitle(currentMessage.severity)}
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
        >
          &times;
        </Button>
      </div>
      
      <div className={`font-mono text-sm my-3 min-h-[24px] pb-2 ${currentMessage.severity >= 4 ? 'font-bold' : ''}`}>
        {displayedText}
        {isTyping && <span className="animate-pulse">|</span>}
      </div>
      
      {!isTyping && (
        <div className="flex justify-end space-x-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('helpful')}
            className={`h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary ${getReactionHighlight('helpful')} hover:border-primary humorous-tooltip`}
            data-tooltip={getRandomTooltip('helpful')}
          >
            👍 Useful
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('funny')}
            className={`h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary ${getReactionHighlight('funny')} hover:border-primary humorous-tooltip`}
            data-tooltip={getRandomTooltip('funny')}
          >
            😄 Funny
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('annoying')}
            className={`h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary ${getReactionHighlight('annoying')} hover:border-primary humorous-tooltip`}
            data-tooltip={getRandomTooltip('annoying')}
          >
            💩 Annoying
          </Button>
        </div>
      )}
    </div>
  );
};
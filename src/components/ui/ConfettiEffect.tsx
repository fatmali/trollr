'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  showConfetti?: boolean;
  onComplete?: () => void;
  type?: 'success' | 'achievement' | 'streak';
}

export function ConfettiEffect({ 
  showConfetti = false, 
  onComplete,
  type = 'success'
}: ConfettiProps) {
  const [confettiShown, setConfettiShown] = useState(false);
  
  // Confetti customization based on reward type
  const getConfettiColors = useCallback(() => {
    switch (type) {
      case 'achievement':
        return ['#8b5cf6', '#6366f1', '#a855f7']; // Purple theme
      case 'streak':
        return ['#f97316', '#f59e0b', '#dc2626']; // Fire theme
      case 'success':
      default:
        return ['#22c55e', '#10b981', '#eab308']; // Success theme
    }
  }, [type]);
  
  // Fire confetti
  const fireConfetti = useCallback(() => {
    const colors = getConfettiColors();
    const duration = type === 'achievement' ? 4000 : 2500;
    
    const end = Date.now() + duration;
    
    // Create two different confetti cannons
    const cannonLeft = confetti.create(undefined, { 
      resize: true, 
      useWorker: true 
    });
    
    const cannonRight = confetti.create(undefined, { 
      resize: true, 
      useWorker: true 
    });
    
    const animateConfetti = () => {
      const timeLeft = end - Date.now();
      
      if (timeLeft <= 0) {
        cannonLeft.reset();
        cannonRight.reset();
        setConfettiShown(true);
        onComplete?.();
        return;
      }
      
      // For achievements, create a more spectacular effect
      if (type === 'achievement') {
        cannonLeft({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
          startVelocity: 35,
          decay: 0.97
        });
        
        cannonRight({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
          startVelocity: 35,
          decay: 0.97
        });
      } else {
        // For regular success, simple but effective
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.4 },
          colors,
          startVelocity: 25,
          gravity: 1.2,
          decay: 0.94
        });
        
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.4 },
          colors,
          startVelocity: 25,
          gravity: 1.2,
          decay: 0.94
        });
      }
      
      requestAnimationFrame(animateConfetti);
    };
    
    animateConfetti();
  }, [getConfettiColors, onComplete, type]);
  
  useEffect(() => {
    if (showConfetti && !confettiShown) {
      fireConfetti();
    }
    
    return () => {
      confetti.reset();
    };
  }, [showConfetti, fireConfetti, confettiShown]);
  
  // This is an invisible component, it just triggers the confetti animation
  return null;
}
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TrollMessage, TrollTriggerType, MCPContext, MCPResponse } from '@/types';

// Temporary local implementation of trollr messages until Azure Functions are set up
const LOCAL_TROLL_RESPONSES: Record<TrollTriggerType, string[]> = {
  deadline_approaching: [
    "Oh look, another deadline approaching. I'm sure you'll start working right before it's due. Classic you.",
    "That deadline is getting closer. Maybe consider, I don't know, actually working on it?",
    "Tick tock! That deadline won't postpone itself, no matter how hard you stare at it."
  ],
  overdue: [
    "Congratulations on missing another deadline! Your consistency is truly remarkable.",
    "Task overdue. Shocking absolutely no one.",
    "Remember when you said you'd finish this on time? That was hilarious."
  ],
  inactivity: [
    "Are you still there? Or did you wander off to watch cat videos again?",
    "Your productivity today is impressively non-existent.",
    "I've seen glaciers move faster than your progress on this task."
  ],
  pomodoro_abandoned: [
    "Another abandoned pomodoro? I'm starting to think you enjoy collecting these.",
    "25 minutes was too much commitment for you, huh?",
    "That pomodoro didn't stand a chance, did it? Poor thing never saw it coming."
  ],
  excuse_response: [
    "That's a creative excuse! Add it to your impressive collection.",
    "Oh, THAT'S why you couldn't finish? Totally valid. *eye roll*",
    "I'll add that to the 'Excuses Hall of Fame'. It's getting quite crowded in there."
  ],
  completion: [
    "Task completed! Want a trophy for doing your job?",
    "You actually finished something? I'm genuinely surprised.",
    "Completed on time? Who are you and what have you done with the real user?"
  ]
};

interface TrollMessageState {
  messages: TrollMessage[];
  addMessage: (userId: string, triggerType: TrollTriggerType, taskId?: string) => TrollMessage;
  generateMessage: (userId: string, context: MCPContext, triggerType: TrollTriggerType, taskId?: string) => Promise<TrollMessage>;
  markAsRead: (messageId: string) => void;
  addReaction: (messageId: string, reaction: 'helpful' | 'funny' | 'annoying') => void;
  getUnreadMessages: (userId: string) => TrollMessage[];
  getMessagesByUserId: (userId: string) => TrollMessage[];
  getMessagesByTaskId: (taskId: string) => TrollMessage[];
}

export const useTrollMessages = create<TrollMessageState>()(
  persist(
    (set, get) => ({
      messages: [],
      
      addMessage: (userId, triggerType, taskId) => {
        // Get a random message for the trigger type
        const messagesForType = LOCAL_TROLL_RESPONSES[triggerType];
        const randomIndex = Math.floor(Math.random() * messagesForType.length);
        const content = messagesForType[randomIndex];
        
        // Generate a severity level (1-5)
        const severity = Math.floor(Math.random() * 5) + 1;
        
        const newMessage: TrollMessage = {
          id: uuidv4(),
          userId,
          taskId,
          content,
          triggerType,
          severity,
          createdAt: new Date().toISOString()
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage]
        }));
        
        return newMessage;
      },
      
      generateMessage: async (userId, context, triggerType, taskId) => {
        try {
          // In a real implementation, this would call the Azure Function with MCP
          // For now, we'll use the local implementation
          
          // Simulate an API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Add some context-awareness to the response (simplified)
          let customContent = '';
          
          if (context.userData && context.userData.displayName) {
            if (triggerType === 'completion') {
              customContent = `Wow ${context.userData.displayName}, you actually finished something! Mark this day in your calendar.`;
            } else if (triggerType === 'overdue') {
              customContent = `${context.userData.displayName}, your ability to miss deadlines is truly impressive. Have you considered a career in procrastination?`;
            }
          }
          
          // If we have custom content based on the context, use it, otherwise fall back to random messages
          const content = customContent || get().addMessage(userId, triggerType, taskId).content;
          
          // Generate a severity level that makes sense for the trigger type
          let severity = 3; // Default medium severity
          if (triggerType === 'overdue' || triggerType === 'pomodoro_abandoned') {
            severity = 4; // Higher severity for negative events
          } else if (triggerType === 'completion') {
            severity = 2; // Lower severity for positive events
          }
          
          const newMessage: TrollMessage = {
            id: uuidv4(),
            userId,
            taskId,
            content,
            triggerType,
            severity,
            createdAt: new Date().toISOString()
          };
          
          set((state) => ({
            messages: [...state.messages, newMessage]
          }));
          
          return newMessage;
        } catch (error) {
          console.error('Failed to generate trollr message:', error);
          // Fall back to local implementation
          return get().addMessage(userId, triggerType, taskId);
        }
      },
      
      markAsRead: (messageId) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId
              ? { ...message, readAt: new Date().toISOString() }
              : message
          )
        }));
      },
      
      addReaction: (messageId, reaction) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId
              ? { ...message, userReaction: reaction }
              : message
          )
        }));
      },
      
      getUnreadMessages: (userId) => {
        return get().messages.filter(
          (message) => message.userId === userId && !message.readAt
        );
      },
      
      getMessagesByUserId: (userId) => {
        return get().messages.filter((message) => message.userId === userId);
      },
      
      getMessagesByTaskId: (taskId) => {
        return get().messages.filter(
          (message) => message.taskId === taskId
        );
      }
    }),
    {
      name: 'trollr-messages-storage'
    }
  )
);
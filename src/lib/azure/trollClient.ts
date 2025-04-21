'use client';

import { MCPContext, MCPResponse, TrollTriggerType } from "@/types";

// This is a placeholder for the actual Azure Functions API client
// In a real implementation, this would make HTTP requests to your Azure Functions endpoints

// Base URL for Azure Functions (would be an environment variable in production)
//const BASE_URL = '/api/trollr'; // This will proxy through Next.js API routes

export async function generateTrollMessage(
  context: MCPContext,
  triggerType: TrollTriggerType
): Promise<MCPResponse> {
  try {
    // In a real implementation, this would be an actual API call
    // For now, we'll simulate a response with a delay
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Log the context and trigger type (useful for debugging)
    console.log('Generating trollr message:', { context, triggerType });
    
    // Create a mock response based on the trigger type
    let message = '';
    let severity = 3; // Default medium severity
    
    const userName = context.userData.displayName || 'Developer';
    
    switch (triggerType) {
      case 'deadline_approaching':
        message = `Hey ${userName}, that deadline is getting closer. Maybe consider working on it instead of pretending to be busy?`;
        severity = 3;
        break;
      case 'overdue':
        message = `Congratulations ${userName}, you've missed another deadline! I'd be impressed if it wasn't so predictable.`;
        severity = 4;
        break;
      case 'inactivity':
        message = `${userName}, I can literally hear cobwebs forming in your task list. Are you still alive over there?`;
        severity = 3;
        break;
      case 'pomodoro_abandoned':
        message = `Wow ${userName}, you couldn't even commit to 25 minutes? That's a new record in lack of focus.`;
        severity = 4;
        break;
      case 'excuse_response':
        message = `"${context.taskData?.title}" isn't going to complete itself, ${userName}. Your excuses are as creative as they are unconvincing.`;
        severity = 3;
        break;
      case 'completion':
        message = `Task completed, ${userName}! Want a medal for doing your job or...?`;
        severity = 2;
        break;
      default:
        message = `Hey ${userName}, just checking in to see if you're actually being productive or just pretending.`;
        severity = 2;
    }
    
    return {
      message,
      severity
    };
  } catch (error) {
    console.error('Error generating trollr message:', error);
    return {
      message: "I'm feeling unusually kind today. You're off the hook... for now.",
      severity: 1
    };
  }
}

// Future functions to implement:
// - generateTaskReminder(taskDetails)
// - generateProcrastinationTroll(inactivityTime)
// - generateCompletionResponse(taskHistory)
// - generateExcuseAnalysis(userExcuse)
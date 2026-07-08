"use server";

export interface ContextEntry {
  id: string;
  userId: string;
  interviewId: string;
  context: {
    currentQuestion: number;
    currentTopic: string;
    difficulty: string;
    timeSpent: number;
    emotionalState: string;
    previousAnswers: string[];
    hintsUsed: number;
    scoreTrend: 'improving' | 'stable' | 'declining';
  };
  timestamp: string;
}

const contextStore = new Map<string, ContextEntry[]>();

export async function saveContext(userId: string, contextData: any): Promise<string> {
  try {
    const id = `context_${Date.now()}_${userId}`;
    const timestamp = new Date().toISOString();

    const contextEntry: ContextEntry = {
      id,
      userId,
      interviewId: contextData.interviewId || `interview_${Date.now()}`,
      context: {
        currentQuestion: contextData.currentQuestion || 0,
        currentTopic: contextData.currentTopic || 'general',
        difficulty: contextData.difficulty || 'medium',
        timeSpent: contextData.timeSpent || 0,
        emotionalState: contextData.emotionalState || 'neutral',
        previousAnswers: contextData.previousAnswers || [],
        hintsUsed: contextData.hintsUsed || 0,
        scoreTrend: contextData.scoreTrend || 'stable'
      },
      timestamp
    };

    const userContexts = contextStore.get(userId) || [];
    userContexts.push(contextEntry);
    contextStore.set(userId, userContexts);

    console.log("📝 Context saved:", {
      id,
      userId,
      interviewId: contextEntry.interviewId,
      question: contextEntry.context.currentQuestion
    });

    return id;
  } catch (error) {
    console.error("Error saving context:", error);
    throw error;
  }
}

export async function getCurrentContext(userId: string): Promise<ContextEntry | null> {
  try {
    const userContexts = contextStore.get(userId) || [];

    if (userContexts.length === 0) {
      return null;
    }

    // Return most recent context
    return userContexts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  } catch (error) {
    console.error("Error getting current context:", error);
    return null;
  }
}

export async function updateContext(userId: string, updates: any): Promise<boolean> {
  try {
    const currentContext = await getCurrentContext(userId);

    if (!currentContext) {
      return false;
    }

    // Create updated context entry
    const updatedContext: ContextEntry = {
      ...currentContext,
      context: {
        ...currentContext.context,
        ...updates
      },
      timestamp: new Date().toISOString()
    };

    // Remove old context and add updated one
    const userContexts = contextStore.get(userId) || [];
    const filteredContexts = userContexts.filter(ctx => ctx.id !== currentContext.id);
    filteredContexts.push(updatedContext);
    contextStore.set(userId, filteredContexts);

    console.log("🔄 Context updated for user:", userId);
    return true;
  } catch (error) {
    console.error("Error updating context:", error);
    return false;
  }
}

export async function getContextHistory(userId: string, limit: number = 20): Promise<ContextEntry[]> {
  try {
    const userContexts = contextStore.get(userId) || [];

    return userContexts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting context history:", error);
    return [];
  }
}
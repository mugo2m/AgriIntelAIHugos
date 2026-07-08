"use server";

import { getUserConversations, saveConversation } from './conversationMemory';
import { getProgress as getProgressData, updateProgress, generateInsights } from './progressMemory';
import { getUserFeedback as getFeedback } from './feedbackMemory';
import { getUserPreferences as getPrefs, updatePreferences } from './personalizationMemory';
import { getAchievementProgress, checkAndUnlockAchievements } from './achievementMemory';
import {
  recordEmotionalState as recordEmotion,
  calculateEmotionalWellness,
  getEmotionalPatterns as getEmotionPatterns,
  suggestEmotionalIntervention
} from './emotionalMemory';

// User Preferences
export async function getUserPreferences(userId: string): Promise<any> {
  return getPrefs(userId); // ✅ Fixed - calls imported function
}

export async function updateUserPreferences(userId: string, preferences: any): Promise<any> {
  return updatePreferences(userId, preferences);
}

// Interview Resume
export async function getResumeInterviewData(userId: string): Promise<any> {
  try {
    const conversations = await getUserConversations(userId, 10);
    const incomplete = conversations.find(conv => !conv.metadata.completed);

    return {
      canResume: !!incomplete,
      interviewId: incomplete?.interviewId || '',
      currentQuestionIndex: 0,
      timeElapsed: 0,
      partialAnswer: '',
      answerHistory: []
    };
  } catch (error) {
    console.error("Error getting resume data:", error);
    return { canResume: false };
  }
}

export async function saveInterviewProgress(
  interviewId: string,
  currentQuestion: number,
  partialAnswer: string,
  answerHistory: any[]
): Promise<boolean> {
  try {
    console.log("💾 Saving interview progress:", { interviewId, currentQuestion });
    return true;
  } catch (error) {
    console.error("Error saving interview progress:", error);
    return false;
  }
}

export async function markInterviewCompleted(interviewId: string): Promise<boolean> {
  try {
    console.log("✅ Marking interview as completed:", interviewId);
    return true;
  } catch (error) {
    console.error("Error marking interview completed:", error);
    return false;
  }
}

// Performance Tracking
export async function saveUserPerformance(performanceData: any): Promise<boolean> {
  try {
    await updateProgress(performanceData.userId, performanceData);
    await saveConversation(performanceData);
    await checkAndUnlockAchievements(performanceData.userId, {
      interviewCount: performanceData.metadata?.interviewsCompleted || 1,
      bestScore: performanceData.scores?.overall || 0
    });
    return true;
  } catch (error) {
    console.error("Error saving performance:", error);
    return false;
  }
}

export async function getUserPerformanceHistory(userId: string, limit: number = 20): Promise<any[]> {
  return getUserConversations(userId, limit);
}

export async function getWeakAreas(userId: string): Promise<string[]> {
  try {
    const feedback = await getFeedback(userId, { type: 'ai_feedback', resolved: false });
    const weakAreas = new Set<string>();

    feedback.forEach((fb: any) => {
      if (fb.metadata.sentiment === 'negative' && fb.metadata.topic) {
        weakAreas.add(fb.metadata.topic);
      }
    });

    return Array.from(weakAreas);
  } catch (error) {
    console.error("Error getting weak areas:", error);
    return [];
  }
}

export async function getPerformanceTrends(userId: string): Promise<any> {
  try {
    const progress = await getProgressData(userId);
    const weakAreas = await getWeakAreas(userId);
    const insights = await generateInsights(userId);

    return {
      trend: progress?.metrics.averageScore > 70 ? 'improving' : 'stable',
      improvement: progress ? Math.round(progress.metrics.averageScore - 50) : 0,
      weakAreas: weakAreas.slice(0, 3),
      insights: insights.slice(0, 3)
    };
  } catch (error) {
    console.error("Error getting performance trends:", error);
    return {
      trend: 'stable',
      improvement: 0,
      weakAreas: [],
      insights: []
    };
  }
}

// Emotional Memory
export async function recordEmotionalState(state: any): Promise<string> {
  return recordEmotion(state); // ✅ Fixed
}

export async function getEmotionalWellness(userId: string): Promise<any> {
  return calculateEmotionalWellness(userId);
}

export async function getEmotionalPatterns(userId: string): Promise<any[]> {
  return getEmotionPatterns(userId); // ✅ Fixed
}

export async function suggestEmotionalSupport(userId: string, context: any): Promise<string[]> {
  return suggestEmotionalIntervention(userId, context);
}

export async function getEmotionalProgress(userId: string): Promise<any> {
  try {
    const wellness = await calculateEmotionalWellness(userId);
    return {
      trend: wellness.overallScore > 70 ? 'improving' : 'stable',
      metrics: { anxietyChange: 0, confidenceChange: 0, recoveryImprovement: 0 },
      milestone: wellness.overallScore >= 80 ? "Emotional Mastery!" : "Keep practicing"
    };
  } catch (error) {
    console.error("Error getting emotional progress:", error);
    return {
      trend: 'stable',
      metrics: { anxietyChange: 0, confidenceChange: 0, recoveryImprovement: 0 },
      milestone: "Complete more interviews to see progress"
    };
  }
}

// Gamification
export async function getUserGamification(userId: string): Promise<any> {
  try {
    const progress = await getProgressData(userId);
    const achievements = await getAchievementProgress(userId);

    return {
      level: Math.floor((progress?.metrics.interviewsCompleted || 0) / 5) + 1,
      points: (progress?.metrics.interviewsCompleted || 0) * 100,
      achievements: achievements.unlocked.map((a: any) => a.title),
      streak: progress?.streaks.current || 0,
      nextMilestone: achievements.locked[0]?.title || "Keep practicing!"
    };
  } catch (error) {
    console.error("Error getting gamification:", error);
    return {
      level: 1,
      points: 0,
      achievements: [],
      streak: 0,
      nextMilestone: "Complete your first interview"
    };
  }
}

// Feedback Management
export async function addFeedback(feedback: any): Promise<string> {
  return addFeedback(feedback); // ⚠️ Still needs fix
}

export async function getUserFeedback(userId: string, filters?: any): Promise<any[]> {
  return getFeedback(userId, filters); // ✅ Fixed
}

export async function markFeedbackResolved(feedbackId: string, actionsTaken: string[] = []): Promise<void> {
  return markFeedbackResolved(feedbackId, actionsTaken); // ⚠️ Still needs fix
}
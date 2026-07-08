"use server";

import { db } from "@/firebase/admin";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import type { EmotionalState, EmotionalWellness } from "./types";

const emotionalStates = new Map<string, EmotionalState[]>();
const emotionalPatterns = new Map<string, any[]>();
const wellnessScores = new Map<string, EmotionalWellness[]>();

function getDefaultWellnessScore(userId: string): EmotionalWellness {
  return {
    userId,
    date: new Date().toISOString(),
    overallScore: 70,
    metrics: {
      anxietyLevel: 5,
      confidenceLevel: 6,
      focusLevel: 7,
      recoverySpeed: 5
    },
    insights: ["Not enough emotional data yet - complete more interviews"],
    recommendations: ["Start with easier questions to build confidence"]
  };
}

export async function recordEmotionalState(state: Omit<EmotionalState, 'timestamp'>): Promise<string> {
  try {
    const userId = state.userId;
    const timestamp = Timestamp.now();
    const id = `emotion_${Date.now()}_${userId}`;

    const emotionalState: EmotionalState = {
      ...state,
      id,
      timestamp
    };

    const emotionRef = doc(db, "users", userId, "emotions", id);
    await setDoc(emotionRef, emotionalState);

    console.log("😊 Recorded emotional state:", {
      id,
      userId,
      emotion: state.emotion,
      intensity: state.intensity
    });

    const userStates = emotionalStates.get(userId) || [];
    userStates.push(emotionalState);
    emotionalStates.set(userId, userStates);

    await analyzeEmotionalPatterns(userId);

    return id;
  } catch (error) {
    console.error("Error recording emotional state:", error);
    throw error;
  }
}

export async function analyzeEmotionalPatterns(userId: string): Promise<any[]> {
  const userStates = emotionalStates.get(userId) || [];
  if (userStates.length < 5) return [];

  const patterns: any[] = [];
  const now = new Date().toISOString();

  const anxiousStates = userStates.filter(s =>
    s.emotion === 'anxious' &&
    s.context.questionDifficulty === 'hard'
  );

  if (anxiousStates.length >= 3) {
    patterns.push({
      userId,
      patternName: "Difficulty-Induced Anxiety",
      description: "Tends to feel anxious when facing difficult questions",
      triggers: ["Hard questions", "Technical complexity", "Time pressure"],
      frequency: anxiousStates.length >= 10 ? 'frequent' : 'occasional',
      impactOnPerformance: 'negative',
      suggestedInterventions: [
        "Practice with gradual difficulty increase",
        "Pre-question calming techniques",
        "Break down complex questions"
      ],
      lastObserved: now
    });
  }

  const confidentStates = userStates.filter(s =>
    s.emotion === 'confident' &&
    s.context.previousEmotion === 'anxious' &&
    s.context.currentScore && s.context.currentScore > 80
  );

  if (confidentStates.length >= 2) {
    patterns.push({
      userId,
      patternName: "Success-Driven Confidence",
      description: "Confidence increases significantly after successful answers",
      triggers: ["High scores", "Correct answers", "Positive feedback"],
      frequency: 'consistent',
      impactOnPerformance: 'positive',
      suggestedInterventions: [
        "Celebrate small wins",
        "Review successful answers to build confidence",
        "Use positive self-talk"
      ],
      lastObserved: now
    });
  }

  emotionalPatterns.set(userId, patterns);
  return patterns;
}

export async function calculateEmotionalWellness(userId: string): Promise<EmotionalWellness> {
  const userStates = emotionalStates.get(userId) || [];
  const lastWeekStates = userStates.filter(s => {
    if (!s.timestamp?.toDate) return false;
    const stateDate = s.timestamp.toDate();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return stateDate > weekAgo;
  });

  if (lastWeekStates.length === 0) {
    return getDefaultWellnessScore(userId);
  }

  const anxietyStates = lastWeekStates.filter(s =>
    ['anxious', 'frustrated', 'overwhelmed'].includes(s.emotion)
  );
  const anxietyLevel = Math.min(10, Math.round((anxietyStates.length / lastWeekStates.length) * 20));

  const confidentStates = lastWeekStates.filter(s =>
    ['confident', 'calm', 'excited', 'proud'].includes(s.emotion)
  );
  const confidenceLevel = Math.min(10, Math.round((confidentStates.length / lastWeekStates.length) * 20));

  let recoverySpeed = 5;
  const negativeStates = lastWeekStates.filter(s =>
    ['anxious', 'frustrated', 'overwhelmed'].includes(s.emotion)
  );

  if (negativeStates.length > 1) {
    const recoveryTimes: number[] = [];
    for (let i = 0; i < negativeStates.length - 1; i++) {
      const currentTime = negativeStates[i].timestamp.toDate().getTime();
      const nextTime = negativeStates[i + 1].timestamp.toDate().getTime();
      const timeDiffMinutes = (nextTime - currentTime) / (1000 * 60);
      recoveryTimes.push(timeDiffMinutes);
    }

    const avgRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
    recoverySpeed = Math.max(1, Math.min(10, Math.round(10 - (avgRecoveryTime / 3))));
  }

  const emotionalVariety = new Set(lastWeekStates.map(s => s.emotion)).size;
  const focusLevel = emotionalVariety <= 3 ? 8 : emotionalVariety <= 5 ? 5 : 3;

  const overallScore = Math.round(
    (confidenceLevel * 0.4) +
    ((10 - anxietyLevel) * 0.3) +
    (focusLevel * 0.2) +
    (recoverySpeed * 0.1)
  ) * 10;

  const insights: string[] = [];
  if (anxietyLevel > 7) insights.push("High anxiety levels detected - consider relaxation techniques");
  if (confidenceLevel < 4) insights.push("Low confidence - focus on strengths and past successes");
  if (recoverySpeed < 4) insights.push("Slow emotional recovery - practice mindfulness between questions");

  const recommendations: string[] = [];
  if (anxietyLevel > 6) recommendations.push("Try 5-minute meditation before interviews");
  if (confidenceLevel < 5) recommendations.push("Review your 3 best interview performances");
  if (recoverySpeed < 5) recommendations.push("Practice 1-minute breathing exercises between questions");

  const wellnessScore: EmotionalWellness = {
    userId,
    date: new Date().toISOString(),
    overallScore,
    metrics: {
      anxietyLevel,
      confidenceLevel,
      focusLevel,
      recoverySpeed
    },
    insights,
    recommendations
  };

  const userScores = wellnessScores.get(userId) || [];
  userScores.push(wellnessScore);
  wellnessScores.set(userId, userScores);

  return wellnessScore;
}

export async function getEmotionalTimeline(userId: string, limitCount: number = 20): Promise<EmotionalState[]> {
  const userStates = emotionalStates.get(userId) || [];
  return userStates
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
    .slice(0, limitCount);
}

export async function getEmotionalPatterns(userId: string): Promise<any[]> {
  return emotionalPatterns.get(userId) || [];
}

export async function getCurrentEmotionalState(userId: string): Promise<EmotionalState | null> {
  const userStates = emotionalStates.get(userId) || [];
  return userStates.length > 0
    ? userStates[userStates.length - 1]
    : null;
}

export async function suggestEmotionalIntervention(userId: string, currentContext: any): Promise<string[]> {
  const patterns = await getEmotionalPatterns(userId);
  const currentState = await getCurrentEmotionalState(userId);

  const interventions: string[] = [];

  if (currentState) {
    switch(currentState.emotion) {
      case 'anxious':
        interventions.push("Take 3 deep breaths (4-7-8 pattern)");
        interventions.push("Remind yourself: 'This is practice, not perfection'");
        interventions.push("Focus on one question at a time");
        break;
      case 'frustrated':
        interventions.push("Take a 2-minute break");
        interventions.push("Write down what's frustrating you");
        interventions.push("Switch to a different question type");
        break;
      case 'overwhelmed':
        interventions.push("Break the question into smaller parts");
        interventions.push("Use the 5-minute rule: just try for 5 minutes");
        interventions.push("Ask for a hint or clarification");
        break;
    }
  }

  patterns.forEach(pattern => {
    if (pattern.impactOnPerformance === 'negative') {
      interventions.push(...pattern.suggestedInterventions.slice(0, 2));
    }
  });

  if (currentContext?.questionDifficulty === 'hard') {
    interventions.push("Start with what you know about the topic");
    interventions.push("It's okay to say 'I would research this further'");
  }

  return [...new Set(interventions)].slice(0, 5);
}

export async function clearUserEmotionalData(userId: string): Promise<void> {
  emotionalStates.delete(userId);
  emotionalPatterns.delete(userId);
  wellnessScores.delete(userId);
  console.log("🧹 Cleared emotional data for user:", userId);
}
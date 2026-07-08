"use server";

import type { ProgressData } from "./types";

const progressData = new Map<string, ProgressData>();

export async function getProgress(userId: string): Promise<ProgressData | null> {
  return progressData.get(userId) || null;
}

export async function updateProgress(userId: string, interviewData: any): Promise<ProgressData> {
  const existing = await getProgress(userId);
  const now = new Date().toISOString();

  const newTimelineEntry = {
    date: now,
    score: interviewData.scores?.overall || 0,
    interviewId: interviewData.interviewId || `interview_${Date.now()}`
  };

  if (!existing) {
    const newProgress: ProgressData = {
      userId,
      metrics: {
        interviewsCompleted: 1,
        averageScore: interviewData.scores?.overall || 0,
        bestScore: interviewData.scores?.overall || 0,
        weakAreas: interviewData.weakAreas || [],
        strongAreas: interviewData.strongAreas || [],
        totalPracticeTime: interviewData.metadata?.duration || 30,
        consistency: 100
      },
      streaks: {
        current: 1,
        longest: 1,
        lastActive: now
      },
      timeline: [newTimelineEntry]
    };

    progressData.set(userId, newProgress);
    console.log("📈 Created progress for user:", userId);
    return newProgress;
  }

  const interviewsCompleted = existing.metrics.interviewsCompleted + 1;
  const totalScore = existing.metrics.averageScore * existing.metrics.interviewsCompleted +
                    (interviewData.scores?.overall || 0);
  const averageScore = totalScore / interviewsCompleted;

  const bestScore = Math.max(existing.metrics.bestScore, interviewData.scores?.overall || 0);

  const weakAreas = [...new Set([...existing.metrics.weakAreas, ...(interviewData.weakAreas || [])])];
  const strongAreas = [...new Set([...existing.metrics.strongAreas, ...(interviewData.strongAreas || [])])];

  const lastActive = new Date(existing.streaks.lastActive);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = existing.streaks.current;
  if (lastActive.toDateString() === yesterday.toDateString() ||
      lastActive.toDateString() === today.toDateString()) {
    currentStreak++;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(existing.streaks.longest, currentStreak);

  const last7Days = existing.timeline.filter(entry => {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  const consistency = Math.round((last7Days.length / 7) * 100);

  const updatedProgress: ProgressData = {
    userId,
    metrics: {
      interviewsCompleted,
      averageScore,
      bestScore,
      weakAreas,
      strongAreas,
      totalPracticeTime: existing.metrics.totalPracticeTime + (interviewData.metadata?.duration || 30),
      consistency
    },
    streaks: {
      current: currentStreak,
      longest: longestStreak,
      lastActive: now
    },
    timeline: [...existing.timeline, newTimelineEntry].slice(-50)
  };

  progressData.set(userId, updatedProgress);
  console.log("📈 Updated progress for user:", userId);
  return updatedProgress;
}

export async function generateInsights(userId: string): Promise<string[]> {
  const progress = await getProgress(userId);
  if (!progress) {
    return ["Complete your first interview to get insights"];
  }

  const insights: string[] = [];

  if (progress.metrics.interviewsCompleted < 3) {
    insights.push("Complete at least 3 interviews for more detailed insights");
  }

  if (progress.metrics.averageScore < 70) {
    insights.push("Focus on fundamentals before attempting advanced questions");
  }

  if (progress.metrics.consistency < 50) {
    insights.push("Practice more consistently for better results");
  }

  if (progress.streaks.current >= 3) {
    insights.push(`Great streak! You've practiced for ${progress.streaks.current} days in a row`);
  }

  if (progress.metrics.weakAreas.length > 0) {
    insights.push(`Focus on: ${progress.metrics.weakAreas.slice(0, 3).join(', ')}`);
  }

  if (progress.metrics.strongAreas.length > 0) {
    insights.push(`Your strengths: ${progress.metrics.strongAreas.slice(0, 3).join(', ')}`);
  }

  return insights.slice(0, 5);
}

export async function getTimeline(userId: string, limit: number = 10): Promise<any[]> {
  const progress = await getProgress(userId);
  if (!progress) return [];

  return progress.timeline
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function clearProgress(userId: string): Promise<void> {
  progressData.delete(userId);
  console.log("🧹 Cleared progress for user:", userId);
}
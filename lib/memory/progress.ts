"use server";

import { db } from "@/firebase/admin";
import { collection, doc, getDoc, setDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import type { ProgressData } from "./types";

export async function getProgress(userId: string): Promise<ProgressData | null> {
  try {
    const progressRef = doc(db, "users", userId, "progress", "current");
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      const data = progressSnap.data();
      return {
        userId,
        metrics: data.metrics || {
          interviewsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          weakAreas: [],
          strongAreas: [],
          totalPracticeTime: 0,
          consistency: 0
        },
        streaks: data.streaks || {
          current: 0,
          longest: 0,
          lastActive: Timestamp.now()
        },
        lastUpdated: data.lastUpdated || Timestamp.now()
      } as ProgressData;
    }

    return null;
  } catch (error) {
    console.error("Error getting progress:", error);
    return null;
  }
}

function calculateConsistency(existing: ProgressData | null, interviewData: any): number {
  if (!existing) return 100;

  const lastWeekInterviews = 1;
  const consistency = Math.round((lastWeekInterviews / 7) * 100);

  return Math.min(100, consistency);
}

export async function updateProgress(userId: string, interviewData: any): Promise<ProgressData> {
  try {
    const existing = await getProgress(userId);
    const now = Timestamp.now();

    const interviewsCompleted = (existing?.metrics.interviewsCompleted || 0) + 1;
    const totalScore = (existing?.metrics.averageScore || 0) * (existing?.metrics.interviewsCompleted || 0) +
                      (interviewData.scores?.overall || 0);
    const averageScore = totalScore / interviewsCompleted;
    const bestScore = Math.max(existing?.metrics.bestScore || 0, interviewData.scores?.overall || 0);

    const weakAreas = [...new Set([
      ...(existing?.metrics.weakAreas || []),
      ...(interviewData.weakAreas || [])
    ])];

    const strongAreas = [...new Set([
      ...(existing?.metrics.strongAreas || []),
      ...(interviewData.strongAreas || [])
    ])];

    const lastActive = existing?.streaks.lastActive?.toDate() || new Date(0);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = existing?.streaks.current || 0;
    if (lastActive.toDateString() === yesterday.toDateString() ||
        lastActive.toDateString() === today.toDateString()) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }

    const longestStreak = Math.max(existing?.streaks.longest || 0, currentStreak);

    const progressData: ProgressData = {
      userId,
      metrics: {
        interviewsCompleted,
        averageScore,
        bestScore,
        weakAreas,
        strongAreas,
        totalPracticeTime: (existing?.metrics.totalPracticeTime || 0) + (interviewData.metadata?.duration || 30),
        consistency: calculateConsistency(existing, interviewData)
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak,
        lastActive: now
      },
      lastUpdated: now
    };

    const progressRef = doc(db, "users", userId, "progress", "current");
    await setDoc(progressRef, progressData, { merge: true });

    console.log("📈 Updated Firebase progress for user:", userId);
    return progressData;
  } catch (error) {
    console.error("Error updating progress:", error);
    throw error;
  }
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

export async function getTimeline(userId: string, limitCount: number = 10): Promise<any[]> {
  try {
    const convRef = collection(db, "users", userId, "conversations");
    const q = query(convRef, orderBy("timestamp", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error getting timeline:", error);
    return [];
  }
}

export async function clearProgress(userId: string): Promise<void> {
  try {
    const progressRef = doc(db, "users", userId, "progress", "current");
    const { deleteDoc } = require("firebase/firestore");
    await deleteDoc(progressRef);
    console.log("🧹 Cleared progress for user:", userId);
  } catch (error) {
    console.error("Error clearing progress:", error);
    throw error;
  }
}
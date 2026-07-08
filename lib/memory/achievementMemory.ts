"use server";

import { db } from "@/firebase/admin";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import type { Achievement } from "./types";

const achievementTemplates: Omit<Achievement, 'userId' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_interview',
    type: 'milestone',
    title: 'First Interview',
    description: 'Complete your first mock interview',
    icon: '🎯'
  },
  {
    id: 'score_90_plus',
    type: 'skill',
    title: 'Interview Master',
    description: 'Score 90% or higher in an interview',
    icon: '🏆'
  },
  {
    id: 'complete_5_interviews',
    type: 'milestone',
    title: 'Consistent Learner',
    description: 'Complete 5 mock interviews',
    icon: '📚'
  }
];

function getLockedAchievements(userId: string, existingAchievements: Achievement[]): Achievement[] {
  const existingIds = new Set(existingAchievements.map(a => a.id));

  return achievementTemplates
    .filter(template => !existingIds.has(template.id))
    .map(template => ({
      ...template,
      userId,
      unlockedAt: null,
      progress: { current: 0, target: 1, percentage: 0 }
    }));
}

function checkAchievementCriteria(achievementId: string, userData: any): boolean {
  switch(achievementId) {
    case 'first_interview':
      return userData.interviewCount >= 1;
    case 'score_90_plus':
      return userData.bestScore >= 90;
    case 'complete_5_interviews':
      return userData.interviewCount >= 5;
    default:
      return false;
  }
}

export async function getAchievementProgress(userId: string): Promise<{
  unlocked: Achievement[];
  inProgress: Achievement[];
  locked: Achievement[];
}> {
  try {
    const achievementsRef = collection(db, "users", userId, "achievements");
    const { query, orderBy, getDocs } = require("firebase/firestore");
    const q = query(achievementsRef, orderBy("unlockedAt", "desc"));
    const snapshot = await getDocs(q);

    const userAchievements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Achievement[];

    const unlocked = userAchievements.filter(a => a.unlockedAt);
    const inProgress = userAchievements.filter(a => a.progress && a.progress.percentage < 100);
    const locked = getLockedAchievements(userId, userAchievements);

    return { unlocked, inProgress, locked };
  } catch (error) {
    console.error("Error getting achievement progress:", error);
    return {
      unlocked: [],
      inProgress: [],
      locked: getLockedAchievements(userId, [])
    };
  }
}

export async function checkAndUnlockAchievements(userId: string, userData: any): Promise<Achievement[]> {
  try {
    const existingAchievements = await getAchievementProgress(userId);
    const existingIds = new Set(existingAchievements.unlocked.map(a => a.id));

    const newAchievements: Achievement[] = [];

    for (const template of achievementTemplates) {
      if (!existingIds.has(template.id) && checkAchievementCriteria(template.id, userData)) {
        const achievement: Achievement = {
          ...template,
          userId,
          unlockedAt: Timestamp.now(),
          progress: { current: 1, target: 1, percentage: 100 }
        };

        const achievementRef = doc(db, "users", userId, "achievements", template.id);
        await setDoc(achievementRef, achievement);

        newAchievements.push(achievement);
        console.log("🏆 Unlocked achievement:", achievement.title, "for user:", userId);
      }
    }

    return newAchievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
}

export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<Achievement | null> {
  try {
    const achievementRef = doc(db, "users", userId, "achievements", achievementId);
    const { getDoc, updateDoc } = require("firebase/firestore");
    const achievementSnap = await getDoc(achievementRef);

    if (achievementSnap.exists()) {
      const achievement = achievementSnap.data() as Achievement;
      const updatedProgress = Math.min(progress, achievement.progress?.target || 1);
      const percentage = Math.min(100, Math.round((updatedProgress / (achievement.progress?.target || 1)) * 100));

      const updates: Partial<Achievement> = {
        progress: {
          current: updatedProgress,
          target: achievement.progress?.target || 1,
          percentage
        }
      };

      if (percentage >= 100 && !achievement.unlockedAt) {
        updates.unlockedAt = Timestamp.now();
        console.log("🏆 Completed achievement:", achievement.title, "for user:", userId);
      }

      await updateDoc(achievementRef, updates);

      return {
        ...achievement,
        ...updates
      };
    }

    return null;
  } catch (error) {
    console.error("Error updating achievement progress:", error);
    return null;
  }
}

export async function clearUserAchievements(userId: string): Promise<void> {
  try {
    console.warn("Batch delete not implemented for achievements");
    console.log("🧹 Would clear achievements for user:", userId);
  } catch (error) {
    console.error("Error clearing achievements:", error);
    throw error;
  }
}
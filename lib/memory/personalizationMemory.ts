"use server";

import { db } from "@/firebase/admin";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import type { UserPreferences } from "./types";

const defaultPreferences: Omit<UserPreferences, 'userId' | 'lastUpdated'> = {
  interviewPreferences: {
    preferredRoles: ['Software Developer'],
    preferredTechStack: ['JavaScript', 'React', 'Node.js'],
    defaultLevel: 'Mid-level',
    defaultType: 'Technical',
    defaultQuestionCount: 5
  },
  learningPreferences: {
    preferredLearningStyle: 'mixed',
    difficultyProgression: 'gradual',
    sessionLengthPreference: 'medium'
  },
  interfacePreferences: {
    theme: 'auto',
    voiceSettings: {
      enabled: true,
      rate: 1.0,
      volume: 0.8,
      language: 'en-US'
    }
  }
};

async function savePreferences(userId: string, preferences: UserPreferences): Promise<void> {
  try {
    const prefsRef = doc(db, "users", userId, "preferences", "current");
    await setDoc(prefsRef, preferences);
  } catch (error) {
    console.error("Error saving preferences:", error);
    throw error;
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const prefsRef = doc(db, "users", userId, "preferences", "current");
    const prefsSnap = await getDoc(prefsRef);

    if (prefsSnap.exists()) {
      return prefsSnap.data() as UserPreferences;
    }

    const defaultPrefs: UserPreferences = {
      ...defaultPreferences,
      userId,
      lastUpdated: Timestamp.now()
    };

    await savePreferences(userId, defaultPrefs);
    return defaultPrefs;
  } catch (error) {
    console.error("Error getting preferences:", error);
    return {
      ...defaultPreferences,
      userId,
      lastUpdated: Timestamp.now()
    };
  }
}

export async function updatePreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const current = await getUserPreferences(userId);

    const updated: UserPreferences = {
      ...current,
      ...updates,
      interviewPreferences: {
        ...current.interviewPreferences,
        ...updates.interviewPreferences
      },
      learningPreferences: {
        ...current.learningPreferences,
        ...updates.learningPreferences
      },
      interfacePreferences: {
        ...current.interfacePreferences,
        ...updates.interfacePreferences
      },
      lastUpdated: Timestamp.now()
    };

    await savePreferences(userId, updated);
    console.log("⚙️ Updated preferences for user:", userId);
    return updated;
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw error;
  }
}

export async function getOptimalInterviewConfig(userId: string): Promise<any> {
  try {
    const prefs = await getUserPreferences(userId);

    return {
      role: prefs.interviewPreferences.preferredRoles[0] || 'Software Developer',
      level: prefs.interviewPreferences.defaultLevel,
      type: prefs.interviewPreferences.defaultType,
      questionCount: prefs.interviewPreferences.defaultQuestionCount,
      techStack: prefs.interviewPreferences.preferredTechStack.slice(0, 3),
      shouldUseVoice: prefs.interfacePreferences.voiceSettings.enabled
    };
  } catch (error) {
    console.error("Error getting optimal config:", error);
    return {
      role: 'Software Developer',
      level: 'Mid-level',
      type: 'Technical',
      questionCount: 5,
      techStack: ['JavaScript', 'React', 'Node.js'],
      shouldUseVoice: true
    };
  }
}

export async function clearPreferences(userId: string): Promise<void> {
  try {
    const prefsRef = doc(db, "users", userId, "preferences", "current");
    const { deleteDoc } = require("firebase/firestore");
    await deleteDoc(prefsRef);
    console.log("🧹 Cleared preferences for user:", userId);
  } catch (error) {
    console.error("Error clearing preferences:", error);
    throw error;
  }
}
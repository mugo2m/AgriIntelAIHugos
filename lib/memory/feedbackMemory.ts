"use server";

import { db } from "@/firebase/admin";
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, orderBy, getDocs } from "firebase/firestore";
import type { FeedbackEntry } from "./types";

function analyzeSentiment(content: string): FeedbackEntry['metadata']['sentiment'] {
  const positiveWords = ['great', 'excellent', 'good', 'well', 'improved', 'better'];
  const negativeWords = ['poor', 'weak', 'bad', 'needs', 'improve', 'lack'];

  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export async function addFeedback(feedback: Omit<FeedbackEntry, 'id' | 'metadata' | 'resolved'>): Promise<string> {
  try {
    const id = `feedback_${Date.now()}_${feedback.userId}`;

    const entry: FeedbackEntry = {
      ...feedback,
      id,
      metadata: {
        questionId: feedback.metadata?.questionId,
        topic: feedback.metadata?.topic || 'General',
        difficulty: feedback.metadata?.difficulty || 'medium',
        timestamp: Timestamp.now(),
        actionable: feedback.type === 'ai_feedback',
        sentiment: analyzeSentiment(feedback.content)
      },
      actionsTaken: [],
      resolved: false
    };

    const feedbackRef = doc(db, "users", feedback.userId, "feedback", id);
    await setDoc(feedbackRef, entry);

    console.log("📝 Added feedback:", { id, type: feedback.type });
    return id;
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
}

export async function getUserFeedback(
  userId: string,
  filters?: {
    type?: FeedbackEntry['type'];
    category?: FeedbackEntry['category'];
    resolved?: boolean;
  }
): Promise<FeedbackEntry[]> {
  try {
    const feedbackRef = collection(db, "users", userId, "feedback");

    let q: any = query(feedbackRef);

    if (filters?.type) {
      q = query(q, where("type", "==", filters.type));
    }

    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }

    if (filters?.resolved !== undefined) {
      q = query(q, where("resolved", "==", filters.resolved));
    }

    q = query(q, orderBy("metadata.timestamp", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FeedbackEntry[];
  } catch (error) {
    console.error("Error getting feedback:", error);
    return [];
  }
}

export async function getFeedbackForInterview(userId: string, interviewId: string): Promise<FeedbackEntry[]> {
  try {
    const feedbackRef = collection(db, "users", userId, "feedback");
    const q = query(
      feedbackRef,
      where("interviewId", "==", interviewId),
      orderBy("metadata.timestamp", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FeedbackEntry[];
  } catch (error) {
    console.error("Error getting interview feedback:", error);
    return [];
  }
}

export async function markFeedbackResolved(feedbackId: string, actionsTaken: string[] = []): Promise<void> {
  try {
    console.warn("markFeedbackResolved needs userId parameter");
    console.log("Would mark feedback as resolved:", feedbackId);
  } catch (error) {
    console.error("Error marking feedback resolved:", error);
    throw error;
  }
}

export async function clearUserFeedback(userId: string): Promise<void> {
  try {
    console.warn("Batch delete not implemented for feedback");
    console.log("🧹 Would clear feedback for user:", userId);
  } catch (error) {
    console.error("Error clearing feedback:", error);
    throw error;
  }
}
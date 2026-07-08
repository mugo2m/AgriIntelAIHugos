"use server";

import { db } from "@/firebase/admin";
import { collection, doc, setDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import type { InterviewMemory } from "./types";

export async function saveConversation(conversationData: any): Promise<string> {
  try {
    const id = `conv_${Date.now()}_${conversationData.userId}`;
    const conversation: InterviewMemory = {
      id,
      userId: conversationData.userId,
      interviewId: conversationData.interviewId || `interview_${Date.now()}`,
      timestamp: Timestamp.now(),
      questions: conversationData.questions || [],
      answers: conversationData.answers || [],
      scores: {
        overall: conversationData.scores?.overall || 0,
        technical: conversationData.scores?.technical || 0,
        behavioral: conversationData.scores?.behavioral || 0,
        communication: conversationData.scores?.communication || 0,
        problemSolving: conversationData.scores?.problemSolving || 0
      },
      metadata: {
        type: conversationData.metadata?.interviewType || "practice",
        difficulty: conversationData.metadata?.difficulty || "medium",
        duration: conversationData.metadata?.duration || 30,
        completed: conversationData.metadata?.completed !== false,
        category: conversationData.metadata?.category || "technical"
      }
    };

    const convRef = doc(db, "users", conversationData.userId, "conversations", id);
    await setDoc(convRef, conversation);

    console.log("💬 Saved Firebase conversation:", { id, userId: conversationData.userId });
    return id;
  } catch (error) {
    console.error("Error saving conversation:", error);
    throw error;
  }
}

export async function getUserConversations(userId: string, limitCount: number = 20): Promise<InterviewMemory[]> {
  try {
    const convRef = collection(db, "users", userId, "conversations");
    const q = query(convRef, orderBy("timestamp", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InterviewMemory[];
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
}

export async function getConversation(conversationId: string): Promise<InterviewMemory | null> {
  console.warn("getConversation needs userId parameter");
  return null;
}

export async function searchConversations(userId: string, queryText: string): Promise<InterviewMemory[]> {
  try {
    const conversations = await getUserConversations(userId, 100);

    return conversations.filter(conv =>
      conv.questions.some(q => q.toLowerCase().includes(queryText.toLowerCase())) ||
      conv.answers.some(a => a.toLowerCase().includes(queryText.toLowerCase()))
    );
  } catch (error) {
    console.error("Error searching conversations:", error);
    return [];
  }
}

export async function getConversationStats(userId: string): Promise<any> {
  try {
    const conversations = await getUserConversations(userId, 100);

    if (conversations.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        bestScore: 0,
        categories: {}
      };
    }

    const scores = conversations.map(c => c.scores.overall);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);

    const categories: Record<string, number> = {};
    conversations.forEach(conv => {
      const category = conv.metadata.category;
      categories[category] = (categories[category] || 0) + 1;
    });

    return {
      total: conversations.length,
      averageScore,
      bestScore,
      categories,
      lastInterview: conversations[0]?.timestamp
    };
  } catch (error) {
    console.error("Error getting conversation stats:", error);
    return {
      total: 0,
      averageScore: 0,
      bestScore: 0,
      categories: {}
    };
  }
}

export async function clearUserConversations(userId: string): Promise<void> {
  try {
    console.warn("Batch delete not implemented for conversations");
    console.log("🧹 Would clear conversations for user:", userId);
  } catch (error) {
    console.error("Error clearing conversations:", error);
    throw error;
  }
}
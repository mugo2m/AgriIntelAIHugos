// app/api/memory/performance/route.ts - SERVER-SIDE API (NO REACT)
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, ...data } = body;

    console.log(`📊 Memory API called:`, { userId, action });

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required"
      }, { status: 400 });
    }

    try {
      const db = getDB();

      if (!db) {
        console.warn("⚠️ Firebase not available for memory API, using mock data");
        return NextResponse.json({
          success: true,
          data: getMockData(action),
          note: "Using mock data (Firebase unavailable)"
        });
      }

      let result;

      switch (action) {
        case 'recordEmotion':
          result = await recordEmotion(db, userId, data);
          break;
        case 'getResumeData':
          result = await getResumeData(db, userId, data);
          break;
        case 'getProgress':
          result = await getProgress(db, userId, data);
          break;
        case 'getPerformanceHistory':
          result = await getPerformanceHistory(db, userId, data);
          break;
        case 'savePerformance':
          result = await savePerformance(db, userId, data);
          break;
        default:
          return NextResponse.json({
            success: false,
            error: `Unknown action: ${action}`
          }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (firebaseError: any) {
      console.error(`❌ Memory API error:`, firebaseError);
      return NextResponse.json({
        success: true,
        data: getMockData(action),
        note: `Using mock data due to error: ${firebaseError.message}`
      });
    }

  } catch (error: any) {
    console.error("❌ Memory API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper functions with proper collection references
async function recordEmotion(db: any, userId: string, data: any) {
  const emotionRef = db.collection("user_emotions").doc(`${userId}_${Date.now()}`);
  await emotionRef.set({
    userId,
    emotion: data.emotion || 'neutral',
    intensity: data.intensity || 0.5,
    timestamp: new Date().toISOString(),
    context: data.context || 'unknown'
  });
  return { recorded: true, emotion: data.emotion };
}

async function getResumeData(db: any, userId: string, data: any) {
  const conversationsRef = db.collection("conversations");
  const snapshot = await conversationsRef
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  const conversations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    userId,
    totalConversations: conversations.length,
    recentConversations: conversations,
    summary: "User interaction data loaded"
  };
}

async function getProgress(db: any, userId: string, data: any) {
  const progressRef = db.collection("user_progress").doc(userId);
  const doc = await progressRef.get();

  if (doc.exists) {
    return doc.data();
  }

  // Create default progress
  const defaultProgress = {
    userId,
    totalInterviews: 0,
    averageScore: 0,
    lastActive: new Date().toISOString(),
    strengths: [],
    weaknesses: [],
    createdAt: new Date().toISOString()
  };

  await progressRef.set(defaultProgress);
  return defaultProgress;
}

async function getPerformanceHistory(db: any, userId: string, data: any) {
  try {
    const feedbackRef = db.collection("feedback");
    const snapshot = await feedbackRef
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    // ⭐ FIX: Always ensure history is an array
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate average score safely
    let averageScore = 0;
    if (history.length > 0) {
      const total = history.reduce((sum, item) => {
        // Safely get totalScore with fallback
        const score = item?.totalScore || item?.scores?.overall || 0;
        return sum + score;
      }, 0);
      averageScore = Math.round(total / history.length);
    }

    return {
      userId,
      totalFeedback: history.length,
      history: history, // Guaranteed to be an array
      averageScore
    };
  } catch (error) {
    console.error("❌ Error in getPerformanceHistory:", error);
    // Return safe empty structure on error
    return {
      userId,
      totalFeedback: 0,
      history: [], // Empty array instead of null/undefined
      averageScore: 0
    };
  }
}

async function savePerformance(db: any, userId: string, data: any) {
  const progressRef = db.collection("user_progress").doc(userId);
  const doc = await progressRef.get();

  const currentData = doc.exists ? doc.data() : {};

  const updatedData = {
    ...currentData,
    userId,
    lastActive: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  };

  await progressRef.set(updatedData, { merge: true });

  return {
    success: true,
    updated: updatedData
  };
}

function getMockData(action: string) {
  switch (action) {
    case 'recordEmotion':
      return { recorded: true, emotion: 'neutral', note: 'mock' };
    case 'getResumeData':
      return {
        userId: 'mock-user',
        totalConversations: 5,
        recentConversations: [],
        summary: "Mock data - Firebase unavailable"
      };
    case 'getProgress':
      return {
        userId: 'mock-user',
        totalInterviews: 3,
        averageScore: 75,
        lastActive: new Date().toISOString(),
        strengths: ['Communication', 'Problem Solving'],
        weaknesses: ['Time Management', 'Technical Depth']
      };
    case 'getPerformanceHistory':
      // ⭐ FIX: Return proper structure with empty array
      return {
        userId: 'mock-user',
        totalFeedback: 0,  // Changed from 3 to 0
        history: [],       // Empty array is CRITICAL
        averageScore: 0    // Changed from 75 to 0
      };
    case 'savePerformance':
      return { success: true, updated: {}, note: 'mock' };
    default:
      return { note: 'Mock data for unknown action' };
  }
}
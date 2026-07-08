// lib/questions/questionGeneratorWithCache.ts
"use server";

import {
  getCachedInterview,
  cacheInterview,
  recordInterviewUsage
} from "@/lib/cache/firestoreInterviewCache";
import { generateQuestions } from "@/lib/ai/questionGenerator";

export async function getInterviewQuestions(
  role: string,
  level: string = 'mid',
  interviewType: string = 'technical',
  questionCount: number = 5,
  userId?: string,
  forceRefresh: boolean = false
): Promise<{
  questions: Array<{
    text: string;
    category: string;
    difficulty: string;
    idealAnswer?: string;
    isCached: boolean;
    cacheId?: string;
  }>;
  cacheInfo: {
    isCached: boolean;
    cacheId?: string;
    usageCount?: number;
    rating?: number;
  };
}> {
  // If force refresh, skip cache
  if (!forceRefresh) {
    // Try to get from cache first
    const cachedInterview = await getCachedInterview(
      role,
      level,
      interviewType,
      questionCount
    );

    if (cachedInterview) {
      // Record usage
      if (userId) {
        await recordInterviewUsage(
          cachedInterview.id,
          userId,
          `session_${Date.now()}`
        );
      }

      return {
        questions: cachedInterview.questions.map(q => ({
          text: q.text,
          category: q.category,
          difficulty: q.difficulty,
          idealAnswer: q.idealAnswer,
          isCached: true,
          cacheId: q.id
        })),
        cacheInfo: {
          isCached: true,
          cacheId: cachedInterview.id,
          usageCount: cachedInterview.metadata?.usageCount,
          rating: cachedInterview.metadata?.averageRating
        }
      };
    }
  }

  // Cache miss or force refresh - generate new questions
  console.log(`🔍 Generating new questions for ${role} (${level}, ${interviewType})`);

  const generatedQuestions = await generateQuestions(
    role,
    level,
    interviewType,
    questionCount
  );

  // Cache the generated questions for future use
  const cacheId = await cacheInterview(
    role,
    level,
    interviewType,
    generatedQuestions.map(q => ({
      text: q.question, // FIX: Added missing text property
      category: q.category,
      difficulty: q.difficulty,
      idealAnswer: q.idealAnswer,
      keywords: q.keywords
    })),
    userId || 'system'
  );

  // FIX: Added missing return statement
  return {
    questions: generatedQuestions.map((q, index) => ({
      text: q.question,
      category: q.category,
      difficulty: q.difficulty,
      idealAnswer: q.idealAnswer,
      isCached: false,
      cacheId: `q_${index}_${Date.now()}`
    })),
    cacheInfo: {
      isCached: false,
      cacheId
    }
  };
}
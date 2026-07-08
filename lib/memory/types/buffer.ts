// 🧠 BUFFER MEMORY TYPES
// For active interview sessions - Extends your existing types

import type { UserPreferences, ResumeInterviewData } from '../types';

// Message types
export type MessageRole = 'user' | 'assistant' | 'system' | 'evaluator';

export interface BufferMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    questionId?: string;
    category?: string;
    difficulty?: string;
    questionType?: string;
    timeSpent?: number;
    score?: number;
    userConfidence?: number;
    hadDifficulty?: boolean;
    neededHint?: boolean;
    aiFeedback?: string;
    improvements?: string[];
    strengths?: string[];
    sentiment?: string;
    interviewId?: string;
  };
}

// Interview context
export interface InterviewContext {
  preferences: Partial<UserPreferences>;
  interviewType: string;
  difficulty: string;
  targetRole?: string;
  companyType?: string;
  currentTopic?: string;
  topicsCovered: string[];
  questionsAsked: number;
  currentQuestionIndex: number;
  timeLimit?: number;
  timeElapsed: number;
  timeRemaining: number;
}

// Live performance tracking
export interface LivePerformance {
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
    behavioral: number;
    overall: number;
  };
  questionPerformance: Array<{
    questionId: string;
    category: string;
    difficulty: string;
    score: number;
    timeSpent: number;
    hadDifficulty: boolean;
    neededHint: boolean;
  }>;
  detectedStrengths: string[];
  detectedWeakAreas: string[];
  confidenceScores: number[];
  averageResponseTime: number;
}

// Main buffer interface
export interface InterviewBuffer {
  sessionId: string;
  userId: string;
  interviewId?: string;
  context: InterviewContext;
  messages: BufferMessage[];
  performance: LivePerformance;
  metadata: {
    startTime: string;
    lastActivity: string;
    status: string;
    totalDuration: number;
    messageCount: number;
    canResume: boolean;
    resumeData?: ResumeInterviewData;
    answeredQuestions: number;
    completionRate: number;
    totalQuestions: number;
    weaknessTrackerId?: string;
  };
  aiContext: {
    recentTopics: string[];
    userKnowledgeGaps: string[];
    suggestedFollowUps: string[];
    topicsToReinforce: string[];
    topicsToAvoid: string[];
  };
}

// For API responses
export interface BufferResponse {
  success: boolean;
  buffer?: any;
  summary?: any;
  error?: string;
}

// For listing buffers
export interface BufferSummary {
  sessionId: string;
  interviewType: string;
  difficulty: string;
  startTime: string;
  duration: number;
  questionsCompleted: number;
  currentScore: number;
  status: string;
  canResume: boolean;
  resumeData?: ResumeInterviewData;
}

// For creating new buffers
export interface CreateBufferParams {
  userId: string;
  interviewType: string;
  difficulty: string;
  preferences: Partial<UserPreferences>;
  targetRole?: string;
  timeLimit?: number;
}
// Core types for Firebase
export interface MemoryConfig {
  maxBufferSize: number;
  persistenceInterval: number;
  enableLocalStorage: boolean;
  vectorDimension: number;
}

export interface InterviewMemory {
  id: string;
  userId: string;
  interviewId: string;
  questions: string[];
  answers: string[];
  scores: {
    overall: number;
    technical: number;
    behavioral: number;
    communication: number;
    problemSolving: number;
  };
  timestamp: any; // Firestore Timestamp or string
  metadata: {
    type: 'practice' | 'real';
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number;
    completed: boolean;
    category: string;
  };
}

export interface ProgressData {
  userId: string;
  metrics: {
    interviewsCompleted: number;
    averageScore: number;
    bestScore: number;
    weakAreas: string[];
    strongAreas: string[];
    totalPracticeTime: number;
    consistency: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastActive: any; // Firestore Timestamp or string
  };
  lastUpdated: any; // Firestore Timestamp or string
}

export interface LearningContext {
  userId: string;
  currentTopic: string;
  difficultyLevel: string;
  learningStyle: string;
  sessionDuration: number;
  lastSession: string;
}

// Emotional memory types
export interface EmotionalState {
  userId: string;
  timestamp: any; // Firestore Timestamp or string
  emotion: 'calm' | 'confident' | 'anxious' | 'frustrated' | 'excited' | 'confused' | 'proud' | 'overwhelmed';
  intensity: number;
  triggers: string[];
  context: {
    interviewId?: string;
    questionId?: string;
    questionDifficulty?: string;
    timeIntoSession?: number;
    currentScore?: number;
    previousEmotion?: string;
  };
  physiologicalSigns?: string[];
  recoveryStrategies?: string[];
}

export interface EmotionalWellness {
  userId: string;
  date: string;
  overallScore: number;
  metrics: {
    anxietyLevel: number;
    confidenceLevel: number;
    focusLevel: number;
    recoverySpeed: number;
  };
}

// Achievement types
export interface Achievement {
  id: string;
  userId: string;
  type: 'milestone' | 'skill' | 'consistency';
  title: string;
  description: string;
  icon: string;
  unlockedAt: any; // Firestore Timestamp or string
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

// Feedback types
export interface FeedbackEntry {
  id: string;
  userId: string;
  interviewId?: string;
  type: 'ai_feedback' | 'user_feedback' | 'system_feedback';
  category: 'technical' | 'behavioral' | 'communication' | 'overall';
  content: string;
  rating?: number;
  metadata: {
    questionId?: string;
    topic?: string;
    difficulty?: string;
    timestamp: any; // Firestore Timestamp or string
    actionable: boolean;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
  actionsTaken?: string[];
  resolved: boolean;
}

// User Preferences
export interface UserPreferences {
  userId: string;
  interviewPreferences: {
    preferredRoles: string[];
    preferredTechStack: string[];
    defaultLevel: 'Junior' | 'Mid-level' | 'Senior';
    defaultType: 'Technical' | 'Behavioral' | 'Mixed';
    defaultQuestionCount: 3 | 5 | 10;
  };
  learningPreferences: {
    preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    difficultyProgression: 'gradual' | 'challenging' | 'mixed';
    sessionLengthPreference: 'short' | 'medium' | 'long';
  };
  interfacePreferences: {
    theme: 'light' | 'dark' | 'auto';
    voiceSettings: {
      enabled: boolean;
      rate: number;
      volume: number;
      language: string;
    };
  };
  lastUpdated: any; // Firestore Timestamp or string
}
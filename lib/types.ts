export interface InterviewConfig {
  type: string;
  role: string;
  level: string;
  questionsCount: number;
  techStack: string[];
  companyType: string;
  timeLimit: number;
  includeBehavioral: boolean;
  includeTechnical: boolean;
  includeCoding: boolean;
  difficulty: string;
  voiceEnabled: boolean;
  videoEnabled: boolean;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  type: string;
  description?: string;
  hints?: string[];
}

export interface UserAnswer {
  questionId: string;
  answer: string;
  timestamp: string;
  score: number;
  feedback: string;
}

export interface ResumeInterviewData {
  interviewId: string;
  sessionId: string;
  interviewType: string;
  difficulty: string;
  role: string;
  questions: InterviewQuestion[];
  currentQuestion?: number; // Changed from currentQuestionIndex
  userAnswers?: UserAnswer[]; // Made optional
  startTime?: string; // Made optional
  timeElapsed: number;
  config?: InterviewConfig; // Made optional
}

// User type for Firebase
export interface User {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  // Add other Firebase user properties as needed
}

// User preferences
export interface UserPreferences {
  userId: string;
  preferredRoles: string[];
  preferredTechStack: string[];
  defaultLevel: "Junior" | "Mid-level" | "Senior";
  defaultType: string;
  defaultQuestionCount: number;
  voiceSettings: {
    enabled: boolean;
    rate: number;
    volume: number;
    language: string;
  };
  updatedAt: string;
}

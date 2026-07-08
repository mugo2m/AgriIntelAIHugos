// types/index.ts

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
  currentQuestion?: number;
  userAnswers?: UserAnswer[];
  startTime?: string;
  timeElapsed: number;
  config?: InterviewConfig;
}

// User type for Firebase
export interface User {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
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

// Crop types
export interface Crop {
  name: string;
  category: "grains" | "pulses" | "cash" | "tubers" | "vegetables" | "fruits" | "cover";
  varieties: string[];
  seedRatePerAcre: number;
  spacing: string;
  plantingMonths: string[];
  maturityMonths: number;
  yieldPerAcre: {
    low: number;
    medium: number;
    high: number;
  };
  pricePerUnit: number;
  grossMargin: {
    low: number;
    medium: number;
    high: number;
  };
}

// Gross margin analysis
export interface GrossMarginAnalysis {
  crop: string;
  low: {
    bags: number;
    pricePerBag: number;
    grossOutput: number;
    seedCost: number;
    fertilizerCost: number;
    labourCost: number;
    transportCost: number;
    bagCost: number;
    totalCost: number;
    grossMargin: number;
  };
  medium: {
    bags: number;
    pricePerBag: number;
    grossOutput: number;
    seedCost: number;
    fertilizerCost: number;
    labourCost: number;
    transportCost: number;
    bagCost: number;
    totalCost: number;
    grossMargin: number;
  };
  high: {
    bags: number;
    pricePerBag: number;
    grossOutput: number;
    seedCost: number;
    fertilizerCost: number;
    labourCost: number;
    transportCost: number;
    bagCost: number;
    totalCost: number;
    grossMargin: number;
  };
  farmerLevel: string;
  recommendation: string;
}
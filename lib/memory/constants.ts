// Memory system constants
export const MEMORY_CONSTANTS = {
  // Buffer memory
  MAX_BUFFER_SIZE: 50,
  BUFFER_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 30 * 1000, // 30 seconds

  // Progress tracking
  MIN_INTERVIEWS_FOR_INSIGHTS: 3,
  MAX_TIMELINE_ENTRIES: 50,
  CONSISTENCY_DAYS: 7,

  // Emotional memory
  EMOTION_INTENSITY_THRESHOLD: 7,
  WELLNESS_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours

  // Achievement system
  ACHIEVEMENT_CHECK_INTERVAL: 60 * 1000, // 1 minute

  // Feedback
  MAX_FEEDBACK_PER_USER: 100,
  FEEDBACK_SENTIMENT_THRESHOLD: 0.7,

  // Vector memory
  VECTOR_DIMENSION: 384,
  SIMILARITY_THRESHOLD: 0.8,
  MAX_SIMILAR_RESULTS: 5,

  // Storage
  LOCAL_STORAGE_PREFIX: 'interview_memory_',
  SESSION_STORAGE_PREFIX: 'interview_session_',

  // Performance
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_REQUESTS: 10
};

// Default configurations
export const DEFAULT_CONFIG = {
  userPreferences: {
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
    }
  },

  learningContext: {
    currentTopic: 'JavaScript Fundamentals',
    difficultyLevel: 'intermediate',
    learningStyle: 'mixed',
    sessionDuration: 30
  },

  progress: {
    streakResetHours: 24,
    practiceGoal: 5, // interviews per week
    improvementThreshold: 5 // percentage
  }
};

// Emotion constants
export const EMOTION_CONSTANTS = {
  EMOTIONS: ['calm', 'confident', 'anxious', 'frustrated', 'excited', 'confused', 'proud', 'overwhelmed'] as const,

  POSITIVE_EMOTIONS: ['calm', 'confident', 'excited', 'proud'],
  NEGATIVE_EMOTIONS: ['anxious', 'frustrated', 'confused', 'overwhelmed'],

  EMOTION_TRIGGERS: {
    anxious: ['difficult_question', 'time_pressure', 'technical_complexity'],
    confident: ['easy_question', 'previous_success', 'familiar_topic'],
    frustrated: ['repeated_mistake', 'unclear_question', 'technical_difficulty'],
    excited: ['new_challenge', 'learning_opportunity', 'positive_feedback']
  },

  EMOTION_INTERVENTIONS: {
    anxious: [
      "Take 3 deep breaths",
      "Break the question into smaller parts",
      "Start with what you know"
    ],
    frustrated: [
      "Take a 2-minute break",
      "Try a different approach",
      "Ask for clarification"
    ],
    overwhelmed: [
      "Prioritize one thing at a time",
      "Use the 5-minute rule",
      "Remember this is practice"
    ]
  }
};

// Achievement constants
export const ACHIEVEMENT_CONSTANTS = {
  MILESTONES: [
    { id: 'first_interview', threshold: 1, points: 100 },
    { id: 'score_90_plus', threshold: 90, points: 200 },
    { id: 'complete_5_interviews', threshold: 5, points: 300 },
    { id: 'seven_day_streak', threshold: 7, points: 500 },
    { id: 'master_topic', threshold: 10, points: 400 }
  ],

  LEVELS: [
    { level: 1, points: 0, title: 'Beginner' },
    { level: 2, points: 500, title: 'Learner' },
    { level: 3, points: 1000, title: 'Practitioner' },
    { level: 4, points: 2000, title: 'Expert' },
    { level: 5, points: 5000, title: 'Master' }
  ],

  REWARDS: {
    level_up: 'New interview templates unlocked',
    achievement_unlocked: 'Exclusive interview insights',
    streak_bonus: 'Double points for next interview'
  }
};
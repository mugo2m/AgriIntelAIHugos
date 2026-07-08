"use server";

export interface LearningPattern {
  id: string;
  userId: string;
  patternType: 'time_of_day' | 'question_type' | 'emotional_trend' | 'performance_pattern';
  pattern: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  lastObserved: string;
  recommendations: string[];
  examples: string[];
  metadata: {
    occurrences: number;
    firstObserved: string;
    averageScoreImpact: number;
  };
}

const patternsStore = new Map<string, LearningPattern[]>();

export async function analyzeLearningPatterns(userId: string, history: any[]): Promise<LearningPattern[]> {
  try {
    console.log("🧠 Analyzing learning patterns for:", userId, "history length:", history.length);

    if (history.length < 3) {
      console.log("Not enough data for pattern analysis");
      return [];
    }

    const patterns: LearningPattern[] = [];
    const now = new Date().toISOString();

    // Pattern 1: Time of day performance
    const morningScores = history.filter(h => {
      const hour = new Date(h.timestamp).getHours();
      return hour >= 6 && hour < 12;
    }).map(h => h.scores?.overall || 0);

    const afternoonScores = history.filter(h => {
      const hour = new Date(h.timestamp).getHours();
      return hour >= 12 && hour < 18;
    }).map(h => h.scores?.overall || 0);

    if (morningScores.length >= 2 && afternoonScores.length >= 2) {
      const morningAvg = morningScores.reduce((a, b) => a + b, 0) / morningScores.length;
      const afternoonAvg = afternoonScores.reduce((a, b) => a + b, 0) / afternoonScores.length;

      if (Math.abs(morningAvg - afternoonAvg) > 10) {
        const betterTime = morningAvg > afternoonAvg ? 'morning' : 'afternoon';
        patterns.push({
          id: `pattern_${Date.now()}_${userId}_time`,
          userId,
          patternType: 'time_of_day',
          pattern: `Performs better in the ${betterTime}`,
          strength: Math.min(100, Math.abs(morningAvg - afternoonAvg) * 2),
          confidence: Math.min(100, Math.max(morningScores.length, afternoonScores.length) * 20),
          lastObserved: now,
          recommendations: [
            `Schedule practice sessions in the ${betterTime}`,
            `Prepare differently for ${betterTime === 'morning' ? 'afternoon' : 'morning'} sessions`
          ],
          examples: [
            `Morning average: ${Math.round(morningAvg)}%`,
            `Afternoon average: ${Math.round(afternoonAvg)}%`
          ],
          metadata: {
            occurrences: Math.max(morningScores.length, afternoonScores.length),
            firstObserved: history[0].timestamp,
            averageScoreImpact: Math.abs(morningAvg - afternoonAvg)
          }
        });
      }
    }

    // Pattern 2: Question type performance
    const categories: Record<string, number[]> = {};
    history.forEach(item => {
      const category = item.metadata?.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item.scores?.overall || 0);
    });

    Object.entries(categories).forEach(([category, scores]) => {
      if (scores.length >= 3) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avgScore < 70 || avgScore > 85) {
          patterns.push({
            id: `pattern_${Date.now()}_${userId}_${category}`,
            userId,
            patternType: 'question_type',
            pattern: `${avgScore < 70 ? 'Struggles with' : 'Excels at'} ${category} questions`,
            strength: avgScore < 70 ? Math.min(100, (70 - avgScore) * 3) : Math.min(100, (avgScore - 85) * 3),
            confidence: Math.min(100, scores.length * 25),
            lastObserved: now,
            recommendations: avgScore < 70 ? [
              `Focus on ${category} fundamentals`,
              `Practice more ${category} questions`,
              `Review ${category} concepts`
            ] : [
              `Leverage ${category} knowledge in interviews`,
              `Help others with ${category} questions`,
              `Explore advanced ${category} topics`
            ],
            examples: [
              `Average score for ${category}: ${Math.round(avgScore)}%`,
              `Number of attempts: ${scores.length}`
            ],
            metadata: {
              occurrences: scores.length,
              firstObserved: history[0].timestamp,
              averageScoreImpact: avgScore < 70 ? -Math.round(70 - avgScore) : Math.round(avgScore - 85)
            }
          });
        }
      }
    });

    // Store patterns
    const existingPatterns = patternsStore.get(userId) || [];
    patternsStore.set(userId, [...existingPatterns, ...patterns]);

    console.log("✅ Found patterns:", patterns.length);
    return patterns;
  } catch (error) {
    console.error("Error analyzing learning patterns:", error);
    return [];
  }
}

export async function getLearningPatterns(userId: string): Promise<LearningPattern[]> {
  try {
    return patternsStore.get(userId) || [];
  } catch (error) {
    console.error("Error getting learning patterns:", error);
    return [];
  }
}

export async function getLearningRecommendations(userId: string): Promise<string[]> {
  try {
    const patterns = await getLearningPatterns(userId);

    if (patterns.length === 0) {
      return [
        "Practice daily for better retention",
        "Focus on one concept at a time",
        "Review previous mistakes regularly",
        "Take breaks between practice sessions"
      ];
    }

    const recommendations: string[] = [];

    patterns.forEach(pattern => {
      recommendations.push(...pattern.recommendations);
    });

    // Add general recommendations
    recommendations.push(
      "Maintain consistent practice schedule",
      "Track your progress weekly",
      "Set specific learning goals"
    );

    // Remove duplicates and limit
    return [...new Set(recommendations)].slice(0, 10);
  } catch (error) {
    console.error("Error getting learning recommendations:", error);
    return [
      "Practice regularly",
      "Review feedback",
      "Set achievable goals"
    ];
  }
}

export async function clearLearningPatterns(userId: string): Promise<void> {
  try {
    patternsStore.delete(userId);
    console.log("🧹 Cleared learning patterns for user:", userId);
  } catch (error) {
    console.error("Error clearing learning patterns:", error);
    throw error;
  }
}
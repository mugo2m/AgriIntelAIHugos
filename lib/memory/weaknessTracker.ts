"use server";

export interface Weakness {
  id: string;
  userId: string;
  area: string;
  category: 'technical' | 'behavioral' | 'communication' | 'problem_solving';
  severity: number; // 1-10
  occurrences: number;
  examples: string[];
  firstObserved: string;
  lastObserved: string;
  improvementPlan: string[];
  progress: {
    currentLevel: number; // 1-10
    targetLevel: number; // 1-10
    improvement: number; // percentage
    lastImprovementDate?: string;
  };
  metadata: {
    averageScoreImpact: number;
    frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
    confidence: number; // 0-100
  };
}

const weaknessesStore = new Map<string, Weakness[]>();

export async function trackWeakness(
  userId: string,
  area: string,
  category: Weakness['category'] = 'technical',
  severity: number = 5,
  example?: string
): Promise<string> {
  try {
    const id = `weakness_${Date.now()}_${userId}`;
    const now = new Date().toISOString();

    const userWeaknesses = weaknessesStore.get(userId) || [];

    // Check if weakness already exists
    const existingWeakness = userWeaknesses.find(w =>
      w.area.toLowerCase() === area.toLowerCase() && w.category === category
    );

    if (existingWeakness) {
      // Update existing weakness
      existingWeakness.occurrences += 1;
      existingWeakness.lastObserved = now;
      existingWeakness.severity = Math.max(existingWeakness.severity, severity);

      if (example && !existingWeakness.examples.includes(example)) {
        existingWeakness.examples.push(example);
        if (existingWeakness.examples.length > 5) {
          existingWeakness.examples.shift(); // Keep only last 5 examples
        }
      }

      console.log("📈 Updated weakness:", {
        id: existingWeakness.id,
        userId,
        area,
        occurrences: existingWeakness.occurrences
      });

      return existingWeakness.id;
    }

    // Create new weakness
    const newWeakness: Weakness = {
      id,
      userId,
      area,
      category,
      severity,
      occurrences: 1,
      examples: example ? [example] : [],
      firstObserved: now,
      lastObserved: now,
      improvementPlan: generateImprovementPlan(area, category),
      progress: {
        currentLevel: 10 - severity, // Lower severity = higher level
        targetLevel: 8, // Target to reach level 8/10
        improvement: 0,
        lastImprovementDate: undefined
      },
      metadata: {
        averageScoreImpact: severity * 2.5, // Higher severity = bigger impact on score
        frequency: 'occasional',
        confidence: 70
      }
    };

    userWeaknesses.push(newWeakness);
    weaknessesStore.set(userId, userWeaknesses);

    console.log("⚠️ New weakness tracked:", {
      id,
      userId,
      area,
      category,
      severity
    });

    return id;
  } catch (error) {
    console.error("Error tracking weakness:", error);
    throw error;
  }
}

function generateImprovementPlan(area: string, category: Weakness['category']): string[] {
  const plans: Record<Weakness['category'], string[]> = {
    technical: [
      "Practice coding exercises daily",
      "Study documentation and tutorials",
      "Build small projects to practice",
      "Review fundamentals regularly",
      "Pair program with others"
    ],
    behavioral: [
      "Prepare STAR method stories",
      "Practice answering common behavioral questions",
      "Record and review your answers",
      "Focus on specific examples and outcomes",
      "Practice with mock interviews"
    ],
    communication: [
      "Practice explaining technical concepts simply",
      "Record and listen to your answers",
      "Focus on clarity and structure",
      "Use the 'PREP' method (Point, Reason, Example, Point)",
      "Practice active listening"
    ],
    problem_solving: [
      "Practice breaking down complex problems",
      "Use whiteboarding for practice",
      "Explain your thought process out loud",
      "Study common algorithms and patterns",
      "Time yourself solving problems"
    ]
  };

  const basePlan = plans[category] || [
    "Practice regularly",
    "Get feedback from others",
    "Track your progress",
    "Set specific goals"
  ];

  // Add area-specific recommendations
  const areaSpecific = [
    `Focus specifically on ${area}`,
    `Find resources about ${area}`,
    `Practice ${area} questions daily`
  ];

  return [...areaSpecific, ...basePlan].slice(0, 6);
}

export async function getWeaknesses(userId: string): Promise<Weakness[]> {
  try {
    const weaknesses = weaknessesStore.get(userId) || [];

    return weaknesses.sort((a, b) => {
      // Sort by severity (descending), then occurrences (descending)
      if (b.severity !== a.severity) {
        return b.severity - a.severity;
      }
      return b.occurrences - a.occurrences;
    });
  } catch (error) {
    console.error("Error getting weaknesses:", error);
    return [];
  }
}

export async function getTopWeaknesses(userId: string, limit: number = 3): Promise<Weakness[]> {
  try {
    const weaknesses = await getWeaknesses(userId);
    return weaknesses.slice(0, limit);
  } catch (error) {
    console.error("Error getting top weaknesses:", error);
    return [];
  }
}

export async function updateWeaknessProgress(
  userId: string,
  weaknessId: string,
  newLevel: number
): Promise<boolean> {
  try {
    const weaknesses = weaknessesStore.get(userId) || [];
    const weaknessIndex = weaknesses.findIndex(w => w.id === weaknessId);

    if (weaknessIndex === -1) {
      return false;
    }

    const weakness = weaknesses[weaknessIndex];
    const oldLevel = weakness.progress.currentLevel;

    weakness.progress = {
      currentLevel: Math.min(10, Math.max(1, newLevel)),
      targetLevel: weakness.progress.targetLevel,
      improvement: Math.round(((newLevel - oldLevel) / (10 - oldLevel)) * 100),
      lastImprovementDate: new Date().toISOString()
    };

    // Update severity based on progress
    weakness.severity = 10 - weakness.progress.currentLevel;

    weaknessesStore.set(userId, weaknesses);

    console.log("📈 Updated weakness progress:", {
      weaknessId,
      userId,
      oldLevel,
      newLevel,
      improvement: weakness.progress.improvement
    });

    return true;
  } catch (error) {
    console.error("Error updating weakness progress:", error);
    return false;
  }
}

export async function getImprovementSuggestions(userId: string): Promise<string[]> {
  try {
    const weaknesses = await getTopWeaknesses(userId, 3);

    if (weaknesses.length === 0) {
      return [
        "Practice more interview questions",
        "Review technical fundamentals",
        "Work on communication skills",
        "Track your performance metrics"
      ];
    }

    const suggestions: string[] = [];

    weaknesses.forEach(weakness => {
      suggestions.push(...weakness.improvementPlan.slice(0, 2));
    });

    // Add general suggestions
    suggestions.push(
      "Set weekly practice goals",
      "Review feedback after each session",
      "Track progress in a journal",
      "Celebrate small improvements"
    );

    return [...new Set(suggestions)].slice(0, 8);
  } catch (error) {
    console.error("Error getting improvement suggestions:", error);
    return [
      "Practice regularly",
      "Review feedback",
      "Set achievable goals"
    ];
  }
}

export async function clearWeaknesses(userId: string): Promise<void> {
  try {
    weaknessesStore.delete(userId);
    console.log("🧹 Cleared weaknesses for user:", userId);
  } catch (error) {
    console.error("Error clearing weaknesses:", error);
    throw error;
  }
}
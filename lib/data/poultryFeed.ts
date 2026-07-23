// lib/data/poultryFeed.ts
// POULTRY FEED REQUIREMENTS – Breed-specific nutrition needs
// Based on KALRO, ILRI, Kenchic, and international poultry nutrition standards

export interface FeedRequirement {
  lifeStage: "starter" | "grower" | "layer" | "broiler_finisher" | "breeder" | "turkey_starter" | "turkey_grower" | "turkey_finisher" | "duck_starter" | "duck_grower" | "quail_starter" | "quail_layer";
  feedType: "mash" | "pellets" | "crumbles" | "whole_grain";
  proteinMin: number;      // Minimum protein % (e.g., 18)
  proteinMax: number;      // Maximum protein % (e.g., 20)
  energyME: number;        // Metabolizable energy (kcal/kg)
  calciumMin: number;      // Minimum calcium %
  calciumMax: number;      // Maximum calcium %
  phosphorusMin: number;   // Available phosphorus %
  lysineMin: number;       // Lysine %
  methionineMin: number;   // Methionine %
  dailyFeedIntakeG: number; // Grams per bird per day
  feedConversionRatio: number; // Kg feed per kg gain or per dozen eggs
  durationWeeks: number;   // How long this feed is used
  recommendedIngredients: string[];
  notes?: string;
}

export const poultryFeedRequirements: Record<string, Record<string, FeedRequirement[]>> = {
  chicken: {
    // --- LAYERS ---
    "KARI Improved Kienyeji": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.0,
        methionineMin: 0.4,
        dailyFeedIntakeG: 15,
        feedConversionRatio: 2.5,
        durationWeeks: 6,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"],
        notes: "Start chicks on chick starter mash. Ensure fresh water always available."
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2750,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 35,
        feedConversionRatio: 3.5,
        durationWeeks: 10,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"],
        notes: "Gradually transition from starter to grower mash over 3 days."
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 3.5,
        calciumMax: 4.5,
        phosphorusMin: 0.35,
        lysineMin: 0.7,
        methionineMin: 0.3,
        dailyFeedIntakeG: 120,
        feedConversionRatio: 2.8,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone (high)", "Salt", "Vitamin premix"],
        notes: "Layer mash must have high calcium for eggshell quality. Oyster shell can be offered separately."
      }
    ],
    "Kuroiler": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 20,
        proteinMax: 22,
        energyME: 2850,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.1,
        methionineMin: 0.45,
        dailyFeedIntakeG: 16,
        feedConversionRatio: 2.2,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"],
        notes: "Kuroilers grow fast – provide high-quality starter."
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.9,
        methionineMin: 0.4,
        dailyFeedIntakeG: 40,
        feedConversionRatio: 3.0,
        durationWeeks: 8,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 17,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 3.5,
        calciumMax: 4.5,
        phosphorusMin: 0.35,
        lysineMin: 0.7,
        methionineMin: 0.3,
        dailyFeedIntakeG: 125,
        feedConversionRatio: 2.7,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    "Sussex": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.0,
        methionineMin: 0.4,
        dailyFeedIntakeG: 15,
        feedConversionRatio: 2.5,
        durationWeeks: 6,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2750,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 35,
        feedConversionRatio: 3.5,
        durationWeeks: 10,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 3.5,
        calciumMax: 4.5,
        phosphorusMin: 0.35,
        lysineMin: 0.7,
        methionineMin: 0.3,
        dailyFeedIntakeG: 120,
        feedConversionRatio: 2.8,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    "Kenbrew (Kenbro)": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.0,
        methionineMin: 0.4,
        dailyFeedIntakeG: 15,
        feedConversionRatio: 2.5,
        durationWeeks: 6,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"],
        notes: "Kenbro is hardy but still needs quality feed for optimal performance."
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2750,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 35,
        feedConversionRatio: 3.5,
        durationWeeks: 10,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 3.5,
        calciumMax: 4.5,
        phosphorusMin: 0.35,
        lysineMin: 0.7,
        methionineMin: 0.3,
        dailyFeedIntakeG: 120,
        feedConversionRatio: 2.8,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    "Brown Leghorn": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 20,
        proteinMax: 22,
        energyME: 2850,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.1,
        methionineMin: 0.45,
        dailyFeedIntakeG: 16,
        feedConversionRatio: 2.2,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.9,
        methionineMin: 0.4,
        dailyFeedIntakeG: 40,
        feedConversionRatio: 3.0,
        durationWeeks: 8,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 17,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 3.5,
        calciumMax: 4.5,
        phosphorusMin: 0.35,
        lysineMin: 0.7,
        methionineMin: 0.3,
        dailyFeedIntakeG: 125,
        feedConversionRatio: 2.7,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    // --- BROILERS ---
    "Cobb 500": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 23,
        proteinMax: 24,
        energyME: 3000,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.3,
        methionineMin: 0.5,
        dailyFeedIntakeG: 25,
        feedConversionRatio: 1.6,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"],
        notes: "Broiler starter has high protein and energy for rapid growth."
      },
      {
        lifeStage: "grower",
        feedType: "pellets",
        proteinMin: 22,
        proteinMax: 23,
        energyME: 3100,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 1.1,
        methionineMin: 0.45,
        dailyFeedIntakeG: 80,
        feedConversionRatio: 1.7,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "broiler_finisher",
        feedType: "pellets",
        proteinMin: 20,
        proteinMax: 21,
        energyME: 3200,
        calciumMin: 0.7,
        calciumMax: 0.9,
        phosphorusMin: 0.35,
        lysineMin: 0.9,
        methionineMin: 0.4,
        dailyFeedIntakeG: 150,
        feedConversionRatio: 1.8,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"],
        notes: "Finisher has higher energy for fat deposition before market."
      }
    ],
    "Ross 308": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 23,
        proteinMax: 24,
        energyME: 3000,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.3,
        methionineMin: 0.5,
        dailyFeedIntakeG: 25,
        feedConversionRatio: 1.6,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "grower",
        feedType: "pellets",
        proteinMin: 22,
        proteinMax: 23,
        energyME: 3100,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 1.1,
        methionineMin: 0.45,
        dailyFeedIntakeG: 80,
        feedConversionRatio: 1.7,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "broiler_finisher",
        feedType: "pellets",
        proteinMin: 20,
        proteinMax: 21,
        energyME: 3200,
        calciumMin: 0.7,
        calciumMax: 0.9,
        phosphorusMin: 0.35,
        lysineMin: 0.9,
        methionineMin: 0.4,
        dailyFeedIntakeG: 150,
        feedConversionRatio: 1.8,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    "Arbor Acres": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 22,
        proteinMax: 23,
        energyME: 2950,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.2,
        methionineMin: 0.48,
        dailyFeedIntakeG: 24,
        feedConversionRatio: 1.65,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "grower",
        feedType: "pellets",
        proteinMin: 21,
        proteinMax: 22,
        energyME: 3050,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 1.0,
        methionineMin: 0.42,
        dailyFeedIntakeG: 75,
        feedConversionRatio: 1.75,
        durationWeeks: 3,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "broiler_finisher",
        feedType: "pellets",
        proteinMin: 19,
        proteinMax: 20,
        energyME: 3150,
        calciumMin: 0.7,
        calciumMax: 0.9,
        phosphorusMin: 0.35,
        lysineMin: 0.8,
        methionineMin: 0.38,
        dailyFeedIntakeG: 145,
        feedConversionRatio: 1.9,
        durationWeeks: 2,
        recommendedIngredients: ["Maize", "Soya meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    // --- INDIGENOUS ---
    "Local Kienyeji": [
      {
        lifeStage: "starter",
        feedType: "mash",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2700,
        calciumMin: 0.8,
        calciumMax: 1.0,
        phosphorusMin: 0.4,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 14,
        feedConversionRatio: 3.0,
        durationWeeks: 8,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"],
        notes: "Local breeds grow slower – use lower protein to save costs."
      },
      {
        lifeStage: "grower",
        feedType: "mash",
        proteinMin: 14,
        proteinMax: 16,
        energyME: 2650,
        calciumMin: 0.8,
        calciumMax: 1.0,
        phosphorusMin: 0.35,
        lysineMin: 0.6,
        methionineMin: 0.3,
        dailyFeedIntakeG: 30,
        feedConversionRatio: 4.0,
        durationWeeks: 12,
        recommendedIngredients: ["Maize", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"],
        notes: "Free-range birds supplement their diet with insects and greens."
      },
      {
        lifeStage: "layer",
        feedType: "mash",
        proteinMin: 14,
        proteinMax: 16,
        energyME: 2600,
        calciumMin: 3.0,
        calciumMax: 4.0,
        phosphorusMin: 0.3,
        lysineMin: 0.6,
        methionineMin: 0.25,
        dailyFeedIntakeG: 100,
        feedConversionRatio: 3.5,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Wheat bran", "Sunflower cake", "Limestone (high)", "Salt", "Vitamin premix"],
        notes: "Lower protein is fine for free-range layers. Provide oyster shell separately."
      }
    ]
  },
  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": [
      {
        lifeStage: "turkey_starter",
        feedType: "mash",
        proteinMin: 28,
        proteinMax: 30,
        energyME: 2900,
        calciumMin: 1.0,
        calciumMax: 1.2,
        phosphorusMin: 0.5,
        lysineMin: 1.5,
        methionineMin: 0.6,
        dailyFeedIntakeG: 30,
        feedConversionRatio: 2.0,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"],
        notes: "Turkeys need higher protein than chickens."
      },
      {
        lifeStage: "turkey_grower",
        feedType: "pellets",
        proteinMin: 24,
        proteinMax: 26,
        energyME: 3000,
        calciumMin: 1.0,
        calciumMax: 1.2,
        phosphorusMin: 0.45,
        lysineMin: 1.3,
        methionineMin: 0.5,
        dailyFeedIntakeG: 80,
        feedConversionRatio: 2.5,
        durationWeeks: 8,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      },
      {
        lifeStage: "turkey_finisher",
        feedType: "pellets",
        proteinMin: 20,
        proteinMax: 22,
        energyME: 3100,
        calciumMin: 0.8,
        calciumMax: 1.0,
        phosphorusMin: 0.4,
        lysineMin: 1.0,
        methionineMin: 0.4,
        dailyFeedIntakeG: 150,
        feedConversionRatio: 3.0,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Vegetable oil", "Limestone", "Salt", "Vitamin premix"]
      }
    ]
  },
  // ==================== DUCKS ====================
  duck: {
    "Pekin": [
      {
        lifeStage: "duck_starter",
        feedType: "mash",
        proteinMin: 20,
        proteinMax: 22,
        energyME: 2800,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.0,
        methionineMin: 0.4,
        dailyFeedIntakeG: 25,
        feedConversionRatio: 2.0,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"],
        notes: "Ducklings need high protein for rapid growth."
      },
      {
        lifeStage: "duck_grower",
        feedType: "pellets",
        proteinMin: 16,
        proteinMax: 18,
        energyME: 2750,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.4,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 60,
        feedConversionRatio: 2.5,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Wheat bran", "Sunflower cake", "Limestone", "Salt", "Vitamin premix"]
      }
    ],
    "Khaki Campbell": [
      {
        lifeStage: "duck_starter",
        feedType: "mash",
        proteinMin: 18,
        proteinMax: 20,
        energyME: 2750,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 0.9,
        methionineMin: 0.35,
        dailyFeedIntakeG: 20,
        feedConversionRatio: 2.2,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Wheat bran", "Limestone", "Salt", "Vitamin premix"]
      }
    ]
  },
  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": [
      {
        lifeStage: "quail_starter",
        feedType: "mash",
        proteinMin: 24,
        proteinMax: 26,
        energyME: 2850,
        calciumMin: 0.9,
        calciumMax: 1.1,
        phosphorusMin: 0.45,
        lysineMin: 1.2,
        methionineMin: 0.5,
        dailyFeedIntakeG: 6,
        feedConversionRatio: 2.0,
        durationWeeks: 4,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Limestone", "Salt", "Vitamin premix"],
        notes: "Quail need high protein for rapid growth and egg production."
      },
      {
        lifeStage: "quail_layer",
        feedType: "mash",
        proteinMin: 20,
        proteinMax: 22,
        energyME: 2750,
        calciumMin: 3.0,
        calciumMax: 3.5,
        phosphorusMin: 0.35,
        lysineMin: 0.8,
        methionineMin: 0.35,
        dailyFeedIntakeG: 12,
        feedConversionRatio: 2.5,
        durationWeeks: 52,
        recommendedIngredients: ["Maize", "Soya meal", "Fish meal", "Limestone (high)", "Salt", "Vitamin premix"],
        notes: "Layer quail need high calcium for eggshell quality."
      }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get feed requirements for a specific breed and life stage.
 */
export function getPoultryFeedRequirements(
  species: string,
  breed: string,
  lifeStage: string
): FeedRequirement | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryFeedRequirements[speciesKey];
  if (!speciesData) return null;

  const breedData = speciesData[breed];
  if (!breedData) return null;

  const matched = breedData.find((req) => req.lifeStage === lifeStage);
  return matched || null;
}

/**
 * Get all feed requirements for a breed.
 */
export function getAllPoultryFeedRequirements(
  species: string,
  breed: string
): FeedRequirement[] {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryFeedRequirements[speciesKey];
  if (!speciesData) return [];

  return speciesData[breed] || [];
}

export const poultryFeed = poultryFeedRequirements;
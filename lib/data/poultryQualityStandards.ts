// lib/data/poultryQualityStandards.ts
// POULTRY QUALITY STANDARDS – Egg and meat characteristics

export interface QualityStandard {
  breed: string;
  eggWeightG: { min: number; max: number; typical: number };
  eggShellColor: "white" | "brown" | "cream" | "blue_green" | "tinted";
  eggYolkColor: "light_yellow" | "golden" | "orange" | "dark_orange";
  eggProductionPerYear: number;
  meatDressingPercent: number; // Carcass yield %
  meatColor: "white" | "dark" | "gamey";
  meatFatContent: "low" | "medium" | "high";
  fatteningPeriodWeeks: number;
  breastMeatPercent: number;
  notes?: string;
}

export const poultryQualityStandards: Record<string, Record<string, QualityStandard[]>> = {
  chicken: {
    "Kuroiler": [
      {
        breed: "Kuroiler",
        eggWeightG: { min: 55, max: 65, typical: 60 },
        eggShellColor: "brown",
        eggYolkColor: "golden",
        eggProductionPerYear: 250,
        meatDressingPercent: 70,
        meatColor: "white",
        meatFatContent: "medium",
        fatteningPeriodWeeks: 12,
        breastMeatPercent: 18,
        notes: "Excellent dual-purpose breed."
      }
    ],
    "KARI Improved Kienyeji": [
      {
        breed: "KARI Improved Kienyeji",
        eggWeightG: { min: 50, max: 60, typical: 55 },
        eggShellColor: "brown",
        eggYolkColor: "orange",
        eggProductionPerYear: 180,
        meatDressingPercent: 65,
        meatColor: "gamey",
        meatFatContent: "low",
        fatteningPeriodWeeks: 20,
        breastMeatPercent: 15,
        notes: "Good yolk colour from free-range."
      }
    ],
    "Local Kienyeji": [
      {
        breed: "Local Kienyeji",
        eggWeightG: { min: 45, max: 55, typical: 50 },
        eggShellColor: "brown",
        eggYolkColor: "dark_orange",
        eggProductionPerYear: 150,
        meatDressingPercent: 60,
        meatColor: "gamey",
        meatFatContent: "low",
        fatteningPeriodWeeks: 24,
        breastMeatPercent: 12,
        notes: "Premium eggs and meat – high market demand."
      }
    ],
    "Cobb 500": [
      {
        breed: "Cobb 500",
        eggWeightG: { min: 0, max: 0, typical: 0 },
        eggShellColor: "white",
        eggYolkColor: "golden",
        eggProductionPerYear: 0,
        meatDressingPercent: 75,
        meatColor: "white",
        meatFatContent: "medium",
        fatteningPeriodWeeks: 6,
        breastMeatPercent: 22,
        notes: "High meat yield, fast growth."
      }
    ],
    "Sussex": [
      {
        breed: "Sussex",
        eggWeightG: { min: 55, max: 65, typical: 60 },
        eggShellColor: "brown",
        eggYolkColor: "golden",
        eggProductionPerYear: 200,
        meatDressingPercent: 68,
        meatColor: "white",
        meatFatContent: "medium",
        fatteningPeriodWeeks: 14,
        breastMeatPercent: 17,
        notes: "Good dual-purpose breed."
      }
    ],
    "Kenbrew (Kenbro)": [
      {
        breed: "Kenbrew (Kenbro)",
        eggWeightG: { min: 50, max: 60, typical: 55 },
        eggShellColor: "brown",
        eggYolkColor: "orange",
        eggProductionPerYear: 180,
        meatDressingPercent: 65,
        meatColor: "gamey",
        meatFatContent: "low",
        fatteningPeriodWeeks: 16,
        breastMeatPercent: 16,
        notes: "Hardy breed with good market appeal."
      }
    ]
  },
  turkey: {
    "Broad Breasted White": [
      {
        breed: "Broad Breasted White",
        eggWeightG: { min: 70, max: 85, typical: 78 },
        eggShellColor: "cream",
        eggYolkColor: "golden",
        eggProductionPerYear: 80,
        meatDressingPercent: 80,
        meatColor: "white",
        meatFatContent: "medium",
        fatteningPeriodWeeks: 16,
        breastMeatPercent: 30,
        notes: "High breast meat yield."
      }
    ]
  },
  duck: {
    "Pekin": [
      {
        breed: "Pekin",
        eggWeightG: { min: 80, max: 95, typical: 88 },
        eggShellColor: "white",
        eggYolkColor: "golden",
        eggProductionPerYear: 150,
        meatDressingPercent: 72,
        meatColor: "dark",
        meatFatContent: "high",
        fatteningPeriodWeeks: 8,
        breastMeatPercent: 20,
        notes: "Fatty duck meat, prized in Asian cuisine."
      }
    ],
    "Khaki Campbell": [
      {
        breed: "Khaki Campbell",
        eggWeightG: { min: 65, max: 75, typical: 70 },
        eggShellColor: "white",
        eggYolkColor: "golden",
        eggProductionPerYear: 250,
        meatDressingPercent: 0,
        meatColor: "dark",
        meatFatContent: "medium",
        fatteningPeriodWeeks: 0,
        breastMeatPercent: 0,
        notes: "Excellent layer, not primarily a meat duck."
      }
    ]
  },
  quail: {
    "Japanese Quail": [
      {
        breed: "Japanese Quail",
        eggWeightG: { min: 8, max: 12, typical: 10 },
        eggShellColor: "cream",
        eggYolkColor: "golden",
        eggProductionPerYear: 250,
        meatDressingPercent: 0,
        meatColor: "dark",
        meatFatContent: "low",
        fatteningPeriodWeeks: 0,
        breastMeatPercent: 0,
        notes: "Small eggs, high production."
      }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get quality standards for a specific breed.
 */
export function getPoultryQuality(
  species: string,
  breed: string
): QualityStandard | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryQualityStandards[speciesKey];
  if (!speciesData) return null;

  const breedData = speciesData[breed] || [];
  return breedData.length > 0 ? breedData[0] : null;
}

export const poultryQuality = poultryQualityStandards;
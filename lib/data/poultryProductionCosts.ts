// lib/data/poultryProductionCosts.ts
// POULTRY PRODUCTION COSTS – Breed-specific financial benchmarks
// Based on Kenyan market prices (2024-2025)
// All costs in KES per bird unless otherwise stated

export interface ProductionCost {
  breed: string;
  system: "battery_cage" | "deep_litter" | "free_range" | "pastured" | "intensive";
  dayOldChickCost: number;
  feedCostPerKg: number;
  feedConversionRatio: number;  // Kg feed per kg meat or per dozen eggs
  totalFeedKg: number;          // Total feed consumed per bird per cycle
  vaccinationCost: number;
  medicationCost: number;
  labourCost: number;
  housingDepreciation: number;
  electricityWater: number;
  mortalityRate: number;        // Percentage (0.05 = 5%)
  transportMarketing: number;
  totalCostPerBird: number;     // Calculated
  breakEvenEggPrice: number;    // KES per tray (for layers)
  breakEvenMeatPrice: number;   // KES per kg (for broilers)
  profitMarginPercent: number;
  expectedYield: number;        // kg meat OR eggs per bird
  cycleDurationWeeks: number;
  notes?: string;
}

export const poultryProductionCosts: Record<string, Record<string, ProductionCost[]>> = {
  chicken: {
    // --- BROILERS ---
    "Cobb 500": [
      {
        breed: "Cobb 500",
        system: "deep_litter",
        dayOldChickCost: 120,
        feedCostPerKg: 65,
        feedConversionRatio: 1.7,
        totalFeedKg: 4.25, // 2.5kg bird × 1.7 FCR
        vaccinationCost: 6,
        medicationCost: 5,
        labourCost: 10,
        housingDepreciation: 8,
        electricityWater: 5,
        mortalityRate: 0.05,
        transportMarketing: 15,
        totalCostPerBird: 0, // Calculated
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 350, // KES per kg
        profitMarginPercent: 20,
        expectedYield: 2.5, // kg meat
        cycleDurationWeeks: 6,
        notes: "Standard broiler production in deep litter system."
      },
      {
        breed: "Cobb 500",
        system: "intensive",
        dayOldChickCost: 120,
        feedCostPerKg: 65,
        feedConversionRatio: 1.6,
        totalFeedKg: 4.0,
        vaccinationCost: 6,
        medicationCost: 4,
        labourCost: 8,
        housingDepreciation: 6,
        electricityWater: 4,
        mortalityRate: 0.04,
        transportMarketing: 15,
        totalCostPerBird: 0,
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 330,
        profitMarginPercent: 25,
        expectedYield: 2.5,
        cycleDurationWeeks: 5.5,
        notes: "High-density intensive system with better FCR."
      }
    ],
    "Ross 308": [
      {
        breed: "Ross 308",
        system: "deep_litter",
        dayOldChickCost: 115,
        feedCostPerKg: 65,
        feedConversionRatio: 1.7,
        totalFeedKg: 4.25,
        vaccinationCost: 6,
        medicationCost: 5,
        labourCost: 10,
        housingDepreciation: 8,
        electricityWater: 5,
        mortalityRate: 0.05,
        transportMarketing: 15,
        totalCostPerBird: 0,
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 340,
        profitMarginPercent: 20,
        expectedYield: 2.5,
        cycleDurationWeeks: 6,
        notes: "Industry standard broiler."
      }
    ],

    // --- LAYERS (Deep Litter) ---
    "Kuroiler": [
      {
        breed: "Kuroiler",
        system: "deep_litter",
        dayOldChickCost: 80,
        feedCostPerKg: 60,
        feedConversionRatio: 2.8, // Kg feed per dozen eggs
        totalFeedKg: 40, // Over 52 weeks
        vaccinationCost: 8,
        medicationCost: 5,
        labourCost: 15,
        housingDepreciation: 10,
        electricityWater: 6,
        mortalityRate: 0.08,
        transportMarketing: 10,
        totalCostPerBird: 0,
        breakEvenEggPrice: 280, // KES per tray
        breakEvenMeatPrice: 0,
        profitMarginPercent: 25,
        expectedYield: 250, // Eggs per year
        cycleDurationWeeks: 52,
        notes: "Kuroiler is a dual-purpose breed with good egg production."
      },
      {
        breed: "Kuroiler",
        system: "free_range",
        dayOldChickCost: 80,
        feedCostPerKg: 55,
        feedConversionRatio: 3.5,
        totalFeedKg: 35,
        vaccinationCost: 8,
        medicationCost: 4,
        labourCost: 10,
        housingDepreciation: 5,
        electricityWater: 2,
        mortalityRate: 0.12,
        transportMarketing: 8,
        totalCostPerBird: 0,
        breakEvenEggPrice: 250,
        breakEvenMeatPrice: 0,
        profitMarginPercent: 30,
        expectedYield: 200,
        cycleDurationWeeks: 52,
        notes: "Free-range reduces feed costs but increases mortality."
      }
    ],
    "KARI Improved Kienyeji": [
      {
        breed: "KARI Improved Kienyeji",
        system: "free_range",
        dayOldChickCost: 70,
        feedCostPerKg: 55,
        feedConversionRatio: 3.5,
        totalFeedKg: 30,
        vaccinationCost: 6,
        medicationCost: 4,
        labourCost: 8,
        housingDepreciation: 4,
        electricityWater: 2,
        mortalityRate: 0.10,
        transportMarketing: 8,
        totalCostPerBird: 0,
        breakEvenEggPrice: 240,
        breakEvenMeatPrice: 0,
        profitMarginPercent: 25,
        expectedYield: 180,
        cycleDurationWeeks: 52,
        notes: "Hardy local breed, lower feed requirements."
      }
    ],

    // --- INDIGENOUS ---
    "Local Kienyeji": [
      {
        breed: "Local Kienyeji",
        system: "free_range",
        dayOldChickCost: 60,
        feedCostPerKg: 50,
        feedConversionRatio: 4.0,
        totalFeedKg: 25,
        vaccinationCost: 4,
        medicationCost: 3,
        labourCost: 6,
        housingDepreciation: 3,
        electricityWater: 1,
        mortalityRate: 0.15,
        transportMarketing: 5,
        totalCostPerBird: 0,
        breakEvenEggPrice: 220,
        breakEvenMeatPrice: 0,
        profitMarginPercent: 20,
        expectedYield: 150,
        cycleDurationWeeks: 52,
        notes: "Very hardy, low input. Eggs sell at premium."
      }
    ],

    // --- DUAL-PURPOSE ---
    "Sussex": [
      {
        breed: "Sussex",
        system: "deep_litter",
        dayOldChickCost: 90,
        feedCostPerKg: 60,
        feedConversionRatio: 3.0,
        totalFeedKg: 38,
        vaccinationCost: 8,
        medicationCost: 5,
        labourCost: 12,
        housingDepreciation: 8,
        electricityWater: 5,
        mortalityRate: 0.08,
        transportMarketing: 10,
        totalCostPerBird: 0,
        breakEvenEggPrice: 270,
        breakEvenMeatPrice: 400,
        profitMarginPercent: 25,
        expectedYield: 200,
        cycleDurationWeeks: 52,
        notes: "Dual-purpose. Good for both meat and eggs."
      }
    ],
    "Kenbrew (Kenbro)": [
      {
        breed: "Kenbrew (Kenbro)",
        system: "free_range",
        dayOldChickCost: 85,
        feedCostPerKg: 55,
        feedConversionRatio: 3.2,
        totalFeedKg: 32,
        vaccinationCost: 6,
        medicationCost: 4,
        labourCost: 10,
        housingDepreciation: 5,
        electricityWater: 2,
        mortalityRate: 0.10,
        transportMarketing: 8,
        totalCostPerBird: 0,
        breakEvenEggPrice: 260,
        breakEvenMeatPrice: 380,
        profitMarginPercent: 30,
        expectedYield: 180,
        cycleDurationWeeks: 52,
        notes: "Hardy dual-purpose breed, good for free-range."
      }
    ]
  },
  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": [
      {
        breed: "Broad Breasted White",
        system: "deep_litter",
        dayOldChickCost: 350,
        feedCostPerKg: 60,
        feedConversionRatio: 3.0,
        totalFeedKg: 30, // 10kg bird × 3.0 FCR
        vaccinationCost: 15,
        medicationCost: 10,
        labourCost: 25,
        housingDepreciation: 15,
        electricityWater: 10,
        mortalityRate: 0.10,
        transportMarketing: 20,
        totalCostPerBird: 0,
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 450,
        profitMarginPercent: 20,
        expectedYield: 10,
        cycleDurationWeeks: 16,
        notes: "Commercial turkey production."
      }
    ],
    "Local Turkey": [
      {
        breed: "Local Turkey",
        system: "free_range",
        dayOldChickCost: 300,
        feedCostPerKg: 55,
        feedConversionRatio: 4.0,
        totalFeedKg: 28,
        vaccinationCost: 10,
        medicationCost: 8,
        labourCost: 18,
        housingDepreciation: 8,
        electricityWater: 5,
        mortalityRate: 0.15,
        transportMarketing: 15,
        totalCostPerBird: 0,
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 400,
        profitMarginPercent: 25,
        expectedYield: 7,
        cycleDurationWeeks: 20,
        notes: "Hardy local turkey, lower input costs."
      }
    ]
  },
  // ==================== DUCKS ====================
  duck: {
    "Pekin": [
      {
        breed: "Pekin",
        system: "deep_litter",
        dayOldChickCost: 120,
        feedCostPerKg: 55,
        feedConversionRatio: 2.5,
        totalFeedKg: 10, // 4kg bird × 2.5 FCR
        vaccinationCost: 10,
        medicationCost: 5,
        labourCost: 15,
        housingDepreciation: 10,
        electricityWater: 5,
        mortalityRate: 0.08,
        transportMarketing: 12,
        totalCostPerBird: 0,
        breakEvenEggPrice: 0,
        breakEvenMeatPrice: 400,
        profitMarginPercent: 20,
        expectedYield: 4,
        cycleDurationWeeks: 8,
        notes: "Fast-growing meat duck."
      }
    ],
    "Khaki Campbell": [
      {
        breed: "Khaki Campbell",
        system: "deep_litter",
        dayOldChickCost: 100,
        feedCostPerKg: 55,
        feedConversionRatio: 3.0,
        totalFeedKg: 35,
        vaccinationCost: 10,
        medicationCost: 5,
        labourCost: 12,
        housingDepreciation: 8,
        electricityWater: 5,
        mortalityRate: 0.08,
        transportMarketing: 10,
        totalCostPerBird: 0,
        breakEvenEggPrice: 280,
        breakEvenMeatPrice: 0,
        profitMarginPercent: 25,
        expectedYield: 250,
        cycleDurationWeeks: 52,
        notes: "Excellent egg producer."
      }
    ]
  },
  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": [
      {
        breed: "Japanese Quail",
        system: "battery_cage",
        dayOldChickCost: 30,
        feedCostPerKg: 60,
        feedConversionRatio: 2.5,
        totalFeedKg: 7,
        vaccinationCost: 4,
        medicationCost: 2,
        labourCost: 5,
        housingDepreciation: 3,
        electricityWater: 2,
        mortalityRate: 0.06,
        transportMarketing: 5,
        totalCostPerBird: 0,
        breakEvenEggPrice: 180,
        breakEvenMeatPrice: 0,
        profitMarginPercent: 30,
        expectedYield: 250,
        cycleDurationWeeks: 52,
        notes: "Small bird, high-density production."
      }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate total cost per bird for a production system.
 */
export function calculateTotalCost(cost: ProductionCost): number {
  return (
    cost.dayOldChickCost +
    (cost.feedCostPerKg * cost.totalFeedKg) +
    cost.vaccinationCost +
    cost.medicationCost +
    cost.labourCost +
    cost.housingDepreciation +
    cost.electricityWater +
    (cost.mortalityRate * cost.dayOldChickCost) +
    cost.transportMarketing
  );
}

/**
 * Get production costs for a specific breed and system.
 */
export function getPoultryProductionCosts(
  species: string,
  breed: string,
  system?: "battery_cage" | "deep_litter" | "free_range" | "pastured" | "intensive"
): ProductionCost[] {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryProductionCosts[speciesKey];
  if (!speciesData) return [];

  const breedData = speciesData[breed] || [];
  if (system) {
    return breedData.filter((c) => c.system === system);
  }
  return breedData;
}

export const poultryCosts = poultryProductionCosts;
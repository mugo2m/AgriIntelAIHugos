// lib/data/poultryBreedTraits.ts
// POULTRY BREED TRAITS – Climate adaptation, behaviour, and characteristics

export interface BreedTraits {
  breed: string;
  heatTolerance: "high" | "medium" | "low";
  coldTolerance: "high" | "medium" | "low";
  broodiness: "high" | "medium" | "low";
  foragingAbility: "high" | "medium" | "low";
  aggressionLevel: "high" | "medium" | "low";
  flightiness: "high" | "medium" | "low";
  eggColor: "white" | "brown" | "cream" | "blue_green" | "tinted";
  eggSize: "small" | "medium" | "large";
  growthRate: "fast" | "medium" | "slow";
  hardiness: "high" | "medium" | "low";
  recommendedClimate: string[];
  notes?: string;
}

export const poultryBreedTraits: Record<string, Record<string, BreedTraits>> = {
  chicken: {
    "KARI Improved Kienyeji": {
      breed: "KARI Improved Kienyeji",
      heatTolerance: "high",
      coldTolerance: "medium",
      broodiness: "medium",
      foragingAbility: "high",
      aggressionLevel: "medium",
      flightiness: "medium",
      eggColor: "brown",
      eggSize: "medium",
      growthRate: "medium",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical", "Semi-arid"],
      notes: "Improved indigenous – good for most Kenyan climates."
    },
    "Kuroiler": {
      breed: "Kuroiler",
      heatTolerance: "high",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "high",
      aggressionLevel: "medium",
      flightiness: "low",
      eggColor: "brown",
      eggSize: "medium",
      growthRate: "medium",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical"],
      notes: "Excellent dual-purpose for free-range systems."
    },
    "Sussex": {
      breed: "Sussex",
      heatTolerance: "medium",
      coldTolerance: "high",
      broodiness: "medium",
      foragingAbility: "medium",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "brown",
      eggSize: "large",
      growthRate: "medium",
      hardiness: "medium",
      recommendedClimate: ["Temperate", "Subtropical"],
      notes: "Traditional British breed, performs best in cooler areas."
    },
    "Kenbrew (Kenbro)": {
      breed: "Kenbrew (Kenbro)",
      heatTolerance: "high",
      coldTolerance: "high",
      broodiness: "high",
      foragingAbility: "high",
      aggressionLevel: "medium",
      flightiness: "medium",
      eggColor: "brown",
      eggSize: "medium",
      growthRate: "medium",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical", "Arid", "Semi-arid"],
      notes: "Very hardy, developed for Kenyan conditions."
    },
    "Brown Leghorn": {
      breed: "Brown Leghorn",
      heatTolerance: "high",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "high",
      aggressionLevel: "high",
      flightiness: "high",
      eggColor: "white",
      eggSize: "medium",
      growthRate: "medium",
      hardiness: "medium",
      recommendedClimate: ["Tropical", "Subtropical"],
      notes: "Excellent layer, but flighty."
    },
    "Hy-Line Brown": {
      breed: "Hy-Line Brown",
      heatTolerance: "medium",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "low",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "brown",
      eggSize: "large",
      growthRate: "medium",
      hardiness: "medium",
      recommendedClimate: ["Tropical", "Subtropical", "Temperate"],
      notes: "Commercial layer, requires good management."
    },
    "Isa Brown": {
      breed: "Isa Brown",
      heatTolerance: "high",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "medium",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "brown",
      eggSize: "large",
      growthRate: "medium",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical"],
      notes: "Top performer in tropical conditions."
    },
    "Cobb 500": {
      breed: "Cobb 500",
      heatTolerance: "medium",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "low",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "white",
      eggSize: "small",
      growthRate: "fast",
      hardiness: "medium",
      recommendedClimate: ["Tropical", "Subtropical", "Temperate"],
      notes: "Fast-growing broiler, needs controlled environment."
    },
    "Ross 308": {
      breed: "Ross 308",
      heatTolerance: "medium",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "low",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "white",
      eggSize: "small",
      growthRate: "fast",
      hardiness: "medium",
      recommendedClimate: ["Tropical", "Subtropical", "Temperate"],
      notes: "Industry standard broiler."
    },
    "Local Kienyeji": {
      breed: "Local Kienyeji",
      heatTolerance: "high",
      coldTolerance: "high",
      broodiness: "high",
      foragingAbility: "high",
      aggressionLevel: "medium",
      flightiness: "high",
      eggColor: "brown",
      eggSize: "small",
      growthRate: "slow",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical", "Arid", "Semi-arid"],
      notes: "Very hardy, but low production."
    }
  },
  turkey: {
    "Broad Breasted White": {
      breed: "Broad Breasted White",
      heatTolerance: "low",
      coldTolerance: "high",
      broodiness: "low",
      foragingAbility: "low",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "cream",
      eggSize: "large",
      growthRate: "fast",
      hardiness: "low",
      recommendedClimate: ["Temperate"],
      notes: "Commercial turkey, needs controlled climate."
    },
    "Local Turkey": {
      breed: "Local Turkey",
      heatTolerance: "high",
      coldTolerance: "high",
      broodiness: "high",
      foragingAbility: "high",
      aggressionLevel: "medium",
      flightiness: "medium",
      eggColor: "cream",
      eggSize: "medium",
      growthRate: "slow",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical", "Arid"],
      notes: "Hardy local turkey for free-range."
    }
  },
  duck: {
    "Khaki Campbell": {
      breed: "Khaki Campbell",
      heatTolerance: "high",
      coldTolerance: "medium",
      broodiness: "low",
      foragingAbility: "high",
      aggressionLevel: "low",
      flightiness: "medium",
      eggColor: "white",
      eggSize: "medium",
      growthRate: "medium",
      hardiness: "high",
      recommendedClimate: ["Tropical", "Subtropical"],
      notes: "Excellent layer, good forager."
    },
    "Pekin": {
      breed: "Pekin",
      heatTolerance: "medium",
      coldTolerance: "high",
      broodiness: "low",
      foragingAbility: "medium",
      aggressionLevel: "low",
      flightiness: "low",
      eggColor: "white",
      eggSize: "large",
      growthRate: "fast",
      hardiness: "medium",
      recommendedClimate: ["Temperate", "Subtropical"],
      notes: "Meat duck, needs water access."
    }
  },
  quail: {
    "Japanese Quail": {
      breed: "Japanese Quail",
      heatTolerance: "medium",
      coldTolerance: "low",
      broodiness: "low",
      foragingAbility: "medium",
      aggressionLevel: "low",
      flightiness: "high",
      eggColor: "cream",
      eggSize: "small",
      growthRate: "fast",
      hardiness: "low",
      recommendedClimate: ["Tropical", "Subtropical"],
      notes: "Needs controlled environment, high egg production."
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get breed traits for a specific breed.
 */
export function getPoultryBreedTraits(
  species: string,
  breed: string
): BreedTraits | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryBreedTraits[speciesKey];
  if (!speciesData) return null;

  return speciesData[breed] || null;
}

export const poultryTraits = poultryBreedTraits;
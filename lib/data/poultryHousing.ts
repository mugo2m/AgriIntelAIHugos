// lib/data/poultryHousing.ts
// POULTRY HOUSING REQUIREMENTS – Space, equipment, and construction specs

export interface HousingRequirement {
  systemType: "deep_litter" | "battery_cage" | "free_range" | "pastured" | "brooder";
  floorSpaceM2PerBird: number;
  perchLengthCmPerBird: number;
  nestBoxRatio: number;      // e.g., 1 nest per 4 birds
  feederSpaceCmPerBird: number;
  drinkerSpaceCmPerBird: number;
  ventilationM3PerKg: number; // m³/hour per kg body weight
  lightingHoursPerDay: number;
  litterDepthCm: number;
  recommendedLitter: string[];
  recommendedFlooring: string[];
  constructionNotes: string;
  costEstimatePerM2: number;  // KES
}

export const poultryHousingRequirements: Record<string, Record<string, HousingRequirement[]>> = {
  chicken: {
    "KARI Improved Kienyeji": [
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.14,
        perchLengthCmPerBird: 15,
        nestBoxRatio: 4,
        feederSpaceCmPerBird: 10,
        drinkerSpaceCmPerBird: 2,
        ventilationM3PerKg: 2.5,
        lightingHoursPerDay: 14,
        litterDepthCm: 10,
        recommendedLitter: ["Wood shavings", "Rice hulls", "Sawdust"],
        recommendedFlooring: ["Concrete", "Compacted earth"],
        constructionNotes: "Provide ventilation at roof level. Ensure no drafts at bird level.",
        costEstimatePerM2: 2500
      },
      {
        systemType: "free_range",
        floorSpaceM2PerBird: 1.0,
        perchLengthCmPerBird: 10,
        nestBoxRatio: 5,
        feederSpaceCmPerBird: 8,
        drinkerSpaceCmPerBird: 2,
        ventilationM3PerKg: 2.0,
        lightingHoursPerDay: 0,
        litterDepthCm: 0,
        recommendedLitter: [],
        recommendedFlooring: ["Natural ground", "Grass"],
        constructionNotes: "Provide a simple shelter for night protection.",
        costEstimatePerM2: 500
      }
    ],
    "Cobb 500": [
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.08,
        perchLengthCmPerBird: 0,
        nestBoxRatio: 0,
        feederSpaceCmPerBird: 12,
        drinkerSpaceCmPerBird: 2,
        ventilationM3PerKg: 3.0,
        lightingHoursPerDay: 18,
        litterDepthCm: 8,
        recommendedLitter: ["Wood shavings", "Rice hulls"],
        recommendedFlooring: ["Concrete"],
        constructionNotes: "High ventilation needed for broiler growth. 18 hours light for feeding.",
        costEstimatePerM2: 3000
      }
    ],
    "Local Kienyeji": [
      {
        systemType: "free_range",
        floorSpaceM2PerBird: 1.5,
        perchLengthCmPerBird: 12,
        nestBoxRatio: 6,
        feederSpaceCmPerBird: 8,
        drinkerSpaceCmPerBird: 2,
        ventilationM3PerKg: 1.5,
        lightingHoursPerDay: 0,
        litterDepthCm: 0,
        recommendedLitter: [],
        recommendedFlooring: ["Natural ground"],
        constructionNotes: "Minimal housing – simple roosts and nest boxes.",
        costEstimatePerM2: 300
      },
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.2,
        perchLengthCmPerBird: 12,
        nestBoxRatio: 5,
        feederSpaceCmPerBird: 8,
        drinkerSpaceCmPerBird: 2,
        ventilationM3PerKg: 2.0,
        lightingHoursPerDay: 12,
        litterDepthCm: 8,
        recommendedLitter: ["Wood shavings", "Sawdust"],
        recommendedFlooring: ["Concrete"],
        constructionNotes: "Local breeds need less space and ventilation.",
        costEstimatePerM2: 1800
      }
    ]
  },
  turkey: {
    "Broad Breasted White": [
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.3,
        perchLengthCmPerBird: 0,
        nestBoxRatio: 0,
        feederSpaceCmPerBird: 20,
        drinkerSpaceCmPerBird: 4,
        ventilationM3PerKg: 4.0,
        lightingHoursPerDay: 14,
        litterDepthCm: 10,
        recommendedLitter: ["Wood shavings"],
        recommendedFlooring: ["Concrete"],
        constructionNotes: "Turkeys need more space and ventilation.",
        costEstimatePerM2: 3500
      }
    ]
  },
  duck: {
    "Pekin": [
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.15,
        perchLengthCmPerBird: 0,
        nestBoxRatio: 0,
        feederSpaceCmPerBird: 12,
        drinkerSpaceCmPerBird: 3,
        ventilationM3PerKg: 3.5,
        lightingHoursPerDay: 14,
        litterDepthCm: 10,
        recommendedLitter: ["Rice hulls", "Wood shavings"],
        recommendedFlooring: ["Concrete"],
        constructionNotes: "Ducks need water access. Keep litter dry.",
        costEstimatePerM2: 3000
      }
    ]
  },
  quail: {
    "Japanese Quail": [
      {
        systemType: "battery_cage",
        floorSpaceM2PerBird: 0.02,
        perchLengthCmPerBird: 0,
        nestBoxRatio: 0,
        feederSpaceCmPerBird: 2,
        drinkerSpaceCmPerBird: 0.5,
        ventilationM3PerKg: 2.0,
        lightingHoursPerDay: 16,
        litterDepthCm: 0,
        recommendedLitter: [],
        recommendedFlooring: ["Wire mesh"],
        constructionNotes: "Battery cages are common for quail. Clean trays regularly.",
        costEstimatePerM2: 5000
      },
      {
        systemType: "deep_litter",
        floorSpaceM2PerBird: 0.05,
        perchLengthCmPerBird: 0,
        nestBoxRatio: 0,
        feederSpaceCmPerBird: 2,
        drinkerSpaceCmPerBird: 0.5,
        ventilationM3PerKg: 2.0,
        lightingHoursPerDay: 14,
        litterDepthCm: 5,
        recommendedLitter: ["Wood shavings"],
        recommendedFlooring: ["Concrete"],
        constructionNotes: "Floor system requires frequent cleaning.",
        costEstimatePerM2: 2500
      }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get housing requirements for a specific breed and system.
 */
export function getPoultryHousing(
  species: string,
  breed: string,
  systemType: "deep_litter" | "battery_cage" | "free_range" | "pastured" | "brooder"
): HousingRequirement | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryHousingRequirements[speciesKey];
  if (!speciesData) return null;

  const breedData = speciesData[breed] || [];
  const matched = breedData.find((h) => h.systemType === systemType);
  return matched || null;
}

export const poultryHousing = poultryHousingRequirements;
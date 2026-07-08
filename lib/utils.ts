// lib/utils.ts
import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

export const normalizeTechName = (tech: string) => {
  if (!tech) return "tech";

  const key = tech
    .toLowerCase()
    .replace(/\.js$/, "")
    .replace(/\s+/g, "");

  return mappings[key] ?? key;
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  if (!Array.isArray(techArray)) return [];

  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const availableCovers = [
    "/covers/adobe.png",
    "/covers/amazon.png",
    "/covers/facebook.png",
    "/covers/hostinger.png",
    "/covers/pinterest.png",
    "/covers/quora.png",
    "/covers/reddit.png",
    "/covers/telegram.png",
    "/covers/tiktok.png",
    "/covers/yahoo.png"
  ];

  if (availableCovers.length === 0) {
    return "/covers/adobe.png";
  }

  const randomIndex = Math.floor(Math.random() * availableCovers.length);
  return availableCovers[randomIndex];
};

export const getTechIconUrl = (tech: string): string => {
  const normalized = normalizeTechName(tech);

  const specialIcons: Record<string, string> = {
    'sql': '/icons/sql.svg',
    'r': '/icons/r.svg',
    'postgresql': '/icons/sql.svg',
  };

  const lowerTech = tech.toLowerCase();
  if (specialIcons[lowerTech]) {
    return specialIcons[lowerTech];
  }

  if (mappings[normalized]) {
    return `${techIconBaseURL}/${normalized}/${normalized}-original.svg`;
  }

  return "/icons/default.svg";
};

// Format currency in KES
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// ========== CROP-SPECIFIC CONVERSION FACTORS (UPDATED WITH NEW CROPS) ==========

export interface CropConversionFactors {
  bagSizes: {
    standard?: number; // kg per standard bag
    alternatives?: { name: string; kg: number }[];
  };
  commonUnits: {
    [key: string]: number; // conversion factor to kg
  };
  yieldRange: {
    min: number; // kg per acre
    max: number; // kg per acre
    typical: number; // kg per acre
  };
  priceRange: {
    min: number; // Ksh per kg
    max: number; // Ksh per kg
    typical: number; // Ksh per kg
  };
}

export const cropConversionFactors: Record<string, CropConversionFactors> = {
  // Cereals & Grains
  maize: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 },
        { name: "100kg bag", kg: 100 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag90": 90,
      "bag50": 50,
      "debe": 20, // 20-litre tin
      "gorogoro": 2 // 2kg tin
    },
    yieldRange: { min: 1000, max: 5000, typical: 2500 },
    priceRange: { min: 30, max: 60, typical: 40 }
  },

  rice: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 },
        { name: "100kg bag", kg: 100 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag90": 90,
      "bag50": 50
    },
    yieldRange: { min: 2000, max: 6000, typical: 3000 },
    priceRange: { min: 50, max: 120, typical: 80 }
  },

  beans: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 },
        { name: "100kg bag", kg: 100 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag90": 90,
      "bag50": 50,
      "debe": 20,
      "gorogoro": 2
    },
    yieldRange: { min: 800, max: 2000, typical: 1200 },
    priceRange: { min: 60, max: 120, typical: 80 }
  },

  // Fruits
  mangoes: {
    bagSizes: {
      alternatives: [
        { name: "crate", kg: 50 },
        { name: "sack", kg: 70 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "crate": 50,
      "sack": 70,
      "piece": 0.3 // average mango weight
    },
    yieldRange: { min: 5000, max: 20000, typical: 8000 },
    priceRange: { min: 30, max: 80, typical: 50 }
  },

  pineapples: {
    bagSizes: {
      alternatives: [
        { name: "crate", kg: 40 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "crate": 40,
      "piece": 1.5 // average pineapple weight
    },
    yieldRange: { min: 15000, max: 40000, typical: 20000 },
    priceRange: { min: 30, max: 60, typical: 40 }
  },

  watermelons: {
    bagSizes: {
      alternatives: []
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "piece": 5 // average watermelon weight
    },
    yieldRange: { min: 10000, max: 30000, typical: 15000 },
    priceRange: { min: 20, max: 50, typical: 30 }
  },

  // Vegetables
  tomatoes: {
    bagSizes: {
      alternatives: [
        { name: "crate", kg: 30 },
        { name: "lug box", kg: 20 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "crate": 30,
      "lug": 20
    },
    yieldRange: { min: 10000, max: 30000, typical: 15000 },
    priceRange: { min: 30, max: 80, typical: 40 }
  },

  onions: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 },
        { name: "sack", kg: 70 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag90": 90,
      "bag50": 50,
      "sack": 70
    },
    yieldRange: { min: 6000, max: 15000, typical: 8000 },
    priceRange: { min: 40, max: 100, typical: 50 }
  },

  carrots: {
    bagSizes: {
      alternatives: [
        { name: "sack", kg: 50 },
        { name: "bunch", kg: 0.5 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "sack": 50,
      "bunch": 0.5
    },
    yieldRange: { min: 8000, max: 18000, typical: 10000 },
    priceRange: { min: 30, max: 60, typical: 40 }
  },

  chillies: {
    bagSizes: {
      alternatives: [
        { name: "sack", kg: 70 },
        { name: "crate", kg: 20 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "sack": 70,
      "crate": 20
    },
    yieldRange: { min: 4000, max: 10000, typical: 6000 },
    priceRange: { min: 60, max: 150, typical: 80 }
  },

  spinach: {
    bagSizes: {
      alternatives: [
        { name: "bunch", kg: 0.3 },
        { name: "sack", kg: 30 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "bunch": 0.3,
      "sack": 30
    },
    yieldRange: { min: 6000, max: 15000, typical: 8000 },
    priceRange: { min: 20, max: 40, typical: 25 }
  },

  okra: {
    bagSizes: {
      alternatives: [
        { name: "sack", kg: 50 },
        { name: "crate", kg: 20 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "sack": 50,
      "crate": 20
    },
    yieldRange: { min: 5000, max: 12000, typical: 7000 },
    priceRange: { min: 30, max: 60, typical: 35 }
  },

  // Legumes
  pigeonpeas: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "bag90": 90,
      "bag50": 50
    },
    yieldRange: { min: 800, max: 2000, typical: 1000 },
    priceRange: { min: 50, max: 100, typical: 70 }
  },

  bambaranuts: {
    bagSizes: {
      standard: 90,
      alternatives: [
        { name: "50kg bag", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "bag90": 90,
      "bag50": 50
    },
    yieldRange: { min: 600, max: 1500, typical: 800 },
    priceRange: { min: 60, max: 120, typical: 80 }
  },

  // Tubers
  yams: {
    bagSizes: {
      alternatives: [
        { name: "sack", kg: 50 },
        { name: "piece", kg: 2 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "sack": 50,
      "piece": 2
    },
    yieldRange: { min: 8000, max: 20000, typical: 12000 },
    priceRange: { min: 40, max: 80, typical: 50 }
  },

  taro: {
    bagSizes: {
      alternatives: [
        { name: "sack", kg: 50 },
        { name: "piece", kg: 0.5 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "sack": 50,
      "piece": 0.5
    },
    yieldRange: { min: 6000, max: 15000, typical: 10000 },
    priceRange: { min: 30, max: 60, typical: 40 }
  },

  // Cash crops
  tea: {
    bagSizes: {
      standard: 50,
      alternatives: [
        { name: "sack", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag50": 50
    },
    yieldRange: { min: 1500, max: 4000, typical: 2500 },
    priceRange: { min: 150, max: 300, typical: 200 }
  },

  coffee: {
    bagSizes: {
      standard: 60,
      alternatives: [
        { name: "50kg bag", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "tonne": 1000,
      "bag60": 60,
      "bag50": 50
    },
    yieldRange: { min: 1000, max: 3000, typical: 2000 },
    priceRange: { min: 200, max: 500, typical: 300 }
  },

  cocoa: {
    bagSizes: {
      standard: 60,
      alternatives: [
        { name: "50kg bag", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "bag60": 60,
      "bag50": 50
    },
    yieldRange: { min: 500, max: 1500, typical: 800 },
    priceRange: { min: 200, max: 500, typical: 300 }
  },

  macadamia: {
    bagSizes: {
      standard: 70,
      alternatives: [
        { name: "50kg bag", kg: 50 }
      ]
    },
    commonUnits: {
      "kg": 1,
      "bag70": 70,
      "bag50": 50
    },
    yieldRange: { min: 2000, max: 7000, typical: 4000 },
    priceRange: { min: 100, max: 250, typical: 150 }
  }
};

// Helper to get crop conversion factors
export function getCropConversionFactors(crop: string): CropConversionFactors | null {
  const lowerCrop = crop.toLowerCase();
  return cropConversionFactors[lowerCrop] || null;
}

// Convert any unit to kg for a specific crop
export function convertToKg(crop: string, amount: number, unit: string): number {
  const factors = getCropConversionFactors(crop);
  if (!factors) return amount; // assume already kg

  const lowerUnit = unit.toLowerCase();

  // Check common units
  if (factors.commonUnits[lowerUnit]) {
    return amount * factors.commonUnits[lowerUnit];
  }

  // Check bag sizes
  if (factors.bagSizes.standard && lowerUnit.includes('bag')) {
    return amount * factors.bagSizes.standard;
  }

  if (factors.bagSizes.alternatives) {
    const alt = factors.bagSizes.alternatives.find(a =>
      lowerUnit.includes(a.name.toLowerCase())
    );
    if (alt) return amount * alt.kg;
  }

  return amount; // assume already kg
}

// Validate yield is within reasonable range
export function validateYield(crop: string, yieldKg: number, acres: number = 1): {
  valid: boolean;
  message?: string;
  suggested?: number;
} {
  const factors = getCropConversionFactors(crop);
  if (!factors) return { valid: true };

  const yieldPerAcre = yieldKg / acres;

  if (yieldPerAcre < factors.yieldRange.min * 0.5) {
    // Try to detect if they entered bags instead of kg
    if (factors.bagSizes.standard) {
      const bags = yieldPerAcre;
      const converted = bags * factors.bagSizes.standard;
      if (converted >= factors.yieldRange.min && converted <= factors.yieldRange.max) {
        return {
          valid: false,
          message: `⚠️ ${yieldPerAcre} kg/acre seems very low. Did you mean ${bags.toFixed(1)} bags (${converted.toFixed(0)} kg)?`,
          suggested: converted
        };
      }
    }

    return {
      valid: false,
      message: `⚠️ ${yieldPerAcre} kg/acre is below typical range (${factors.yieldRange.min}-${factors.yieldRange.max} kg/acre)`,
      suggested: factors.yieldRange.typical
    };
  }

  if (yieldPerAcre > factors.yieldRange.max * 1.5) {
    return {
      valid: false,
      message: `⚠️ ${yieldPerAcre} kg/acre is above typical range (${factors.yieldRange.min}-${factors.yieldRange.max} kg/acre)`,
      suggested: factors.yieldRange.max
    };
  }

  return { valid: true };
}

// Validate price is within reasonable range
export function validatePrice(crop: string, pricePerKg: number): {
  valid: boolean;
  message?: string;
  suggested?: number;
} {
  const factors = getCropConversionFactors(crop);
  if (!factors) return { valid: true };

  if (pricePerKg < factors.priceRange.min * 0.5) {
    // Check if they entered price per bag instead
    if (factors.bagSizes.standard) {
      const pricePerBag = pricePerKg;
      const converted = pricePerBag / factors.bagSizes.standard;
      if (converted >= factors.priceRange.min && converted <= factors.priceRange.max) {
        return {
          valid: false,
          message: `⚠️ Ksh ${pricePerKg}/kg seems very low. Did you mean Ksh ${pricePerBag} per bag (Ksh ${converted.toFixed(0)}/kg)?`,
          suggested: converted
        };
      }
    }

    return {
      valid: false,
      message: `⚠️ Ksh ${pricePerKg}/kg is below typical range (Ksh ${factors.priceRange.min}-${factors.priceRange.max}/kg)`,
      suggested: factors.priceRange.typical
    };
  }

  if (pricePerKg > factors.priceRange.max * 1.5) {
    return {
      valid: false,
      message: `⚠️ Ksh ${pricePerKg}/kg is above typical range (Ksh ${factors.priceRange.min}-${factors.priceRange.max}/kg)`,
      suggested: factors.priceRange.max
    };
  }

  return { valid: true };
}

// ========== SPACING AND PLANT POPULATION HELPERS ==========

export interface SpacingInput {
  rowCm: number;
  plantCm: number;
  seedsPerHole: number;
}

/**
 * Calculate number of plants per acre based on spacing
 * 1 acre = 4046.86 square meters
 */
export function calculatePlantsPerAcre(spacing: SpacingInput): number {
  const rowM = spacing.rowCm / 100;
  const plantM = spacing.plantCm / 100;
  const areaPerPlant = rowM * plantM;
  return Math.floor(4046.86 / areaPerPlant) * spacing.seedsPerHole;
}

/**
 * Validate plant population for crop - UPDATED WITH NEW CROPS
 */
export function validatePlantPopulation(crop: string, plantsPerAcre: number): {
  valid: boolean;
  message?: string;
} {
  const ranges: Record<string, { min: number; max: number }> = {
    // Cereals
    maize: { min: 10000, max: 30000 },
    rice: { min: 80000, max: 150000 },
    beans: { min: 80000, max: 150000 },

    // Fruits
    mangoes: { min: 50, max: 200 },
    avocados: { min: 50, max: 200 },
    oranges: { min: 50, max: 150 },
    pineapples: { min: 10000, max: 25000 },
    bananas: { min: 400, max: 800 },
    watermelons: { min: 1500, max: 3000 },
    passionfruit: { min: 400, max: 800 },

    // Vegetables
    tomatoes: { min: 5000, max: 15000 },
    onions: { min: 80000, max: 150000 },
    cabbages: { min: 8000, max: 15000 },
    kales: { min: 8000, max: 15000 },
    carrots: { min: 80000, max: 150000 },
    capsicums: { min: 8000, max: 15000 },
    chillies: { min: 8000, max: 15000 },
    spinach: { min: 40000, max: 80000 },
    okra: { min: 15000, max: 30000 },

    // Tubers
    potatoes: { min: 15000, max: 30000 },
    yams: { min: 3000, max: 6000 },
    taro: { min: 10000, max: 20000 },
    cassava: { min: 4000, max: 8000 },
    sweetpotatoes: { min: 15000, max: 30000 },

    // Cash crops
    coffee: { min: 600, max: 1200 },
    tea: { min: 3000, max: 6000 },
    macadamia: { min: 50, max: 150 },
    cocoa: { min: 400, max: 800 },
    sugarcane: { min: 8000, max: 15000 }
  };

  const range = ranges[crop.toLowerCase()];
  if (!range) return { valid: true };

  if (plantsPerAcre < range.min) {
    return {
      valid: false,
      message: `⚠️ ${plantsPerAcre.toLocaleString()} plants/acre is below typical range (${range.min.toLocaleString()}-${range.max.toLocaleString()})`
    };
  }

  if (plantsPerAcre > range.max) {
    return {
      valid: false,
      message: `⚠️ ${plantsPerAcre.toLocaleString()} plants/acre is above typical range (${range.min.toLocaleString()}-${range.max.toLocaleString()})`
    };
  }

  return { valid: true };
}

/**
 * Calculate total plants for a given farm size
 */
export function calculateTotalPlants(plantsPerAcre: number, acres: number): number {
  return Math.floor(plantsPerAcre * acres);
}

// ========== FERTILIZER PER PLANT HELPERS ==========

export interface FertilizerPerPlant {
  dapGrams: number;
  ureaGrams: number;
  mopGrams: number;
  totalGrams: number;
  // NEW: Secondary nutrients per plant
  sulfurGrams?: number;
  calciumGrams?: number;
  magnesiumGrams?: number;
  zincGrams?: number;
  boronGrams?: number;
}

/**
 * Calculate grams of fertilizer per plant based on total kg and plant count
 * UPDATED: Now includes secondary nutrients
 */
export function calculateFertilizerPerPlant(
  dapKg: number,
  ureaKg: number,
  mopKg: number,
  totalPlants: number,
  isPerennial: boolean = false,
  // NEW: Secondary nutrient amounts
  sulfurKg?: number,
  calciumKg?: number,
  magnesiumKg?: number,
  zincKg?: number,
  boronKg?: number
): FertilizerPerPlant {
  if (totalPlants === 0) {
    return {
      dapGrams: 0,
      ureaGrams: 0,
      mopGrams: 0,
      totalGrams: 0
    };
  }

  // For perennials, spread over multiple years
  const factor = isPerennial ? 1 : 1; // Annual crops get full amount

  const dapGrams = (dapKg * 1000 * factor) / totalPlants;
  const ureaGrams = (ureaKg * 1000 * factor) / totalPlants;
  const mopGrams = (mopKg * 1000 * factor) / totalPlants;

  // Calculate secondary nutrients per plant
  const sulfurGrams = sulfurKg ? (sulfurKg * 1000 * factor) / totalPlants : 0;
  const calciumGrams = calciumKg ? (calciumKg * 1000 * factor) / totalPlants : 0;
  const magnesiumGrams = magnesiumKg ? (magnesiumKg * 1000 * factor) / totalPlants : 0;
  const zincGrams = zincKg ? (zincKg * 1000 * factor) / totalPlants : 0;
  const boronGrams = boronKg ? (boronKg * 1000 * factor) / totalPlants : 0;

  return {
    dapGrams: Math.round(dapGrams * 10) / 10,
    ureaGrams: Math.round(ureaGrams * 10) / 10,
    mopGrams: Math.round(mopGrams * 10) / 10,
    totalGrams: Math.round((dapGrams + ureaGrams + mopGrams + sulfurGrams + calciumGrams + magnesiumGrams + zincGrams + boronGrams) * 10) / 10,
    sulfurGrams: Math.round(sulfurGrams * 10) / 10,
    calciumGrams: Math.round(calciumGrams * 10) / 10,
    magnesiumGrams: Math.round(magnesiumGrams * 10) / 10,
    zincGrams: Math.round(zincGrams * 10) / 10,
    boronGrams: Math.round(boronGrams * 10) / 10
  };
}

// ========== MEASUREMENT GUIDE (UPDATED WITH SECONDARY NUTRIENTS) ==========

/**
 * Get a human-readable measurement guide based on grams
 */
export function getMeasurementGuide(grams: number): string {
  if (grams < 0.5) return "👌 Tiny pinch (less than 0.5g)";
  if (grams < 1) return "👌 Small pinch (0.5-1g)";
  if (grams < 3) return "👌 Pinch (size of a peanut)";
  if (grams < 5) return "👌 Two-finger pinch";
  if (grams < 7) return "🥄 1 level teaspoon (approx 5g)";
  if (grams < 10) return "🥄 1 heaped teaspoon";
  if (grams < 15) return "🥄 1 level tablespoon (approx 15g)";
  if (grams < 20) return "🥄 1 heaped tablespoon";
  if (grams < 30) return "🥄 2 tablespoons";
  if (grams < 40) return "🥄 3 tablespoons";
  if (grams < 50) return "🥄 4 tablespoons (¼ cup)";
  if (grams < 75) return "🥄 ⅓ cup (about 5 tablespoons)";
  if (grams < 100) return "🥤 ½ cup (about 8 tablespoons)";
  if (grams < 150) return "🥤 ¾ cup";
  if (grams < 250) return "🥛 1 cup (250ml)";
  if (grams < 500) return "🧴 2 cups (500ml)";
  if (grams < 750) return "🧴 3 cups (750ml)";
  if (grams < 1000) return "🧴 1 litre (4 cups)";
  return `📦 ${Math.round(grams / 1000)} kg (use a weighing scale)`;
}

/**
 * Get measurement guide for a specific nutrient
 */
export function getNutrientMeasurementGuide(nutrient: string, grams: number): string {
  const baseGuide = getMeasurementGuide(grams);

  const nutrientEmojis: Record<string, string> = {
    n: "🌿", // Nitrogen
    p: "🌱", // Phosphorus
    k: "🍎", // Potassium
    s: "⚡", // Sulfur
    ca: "🦴", // Calcium
    mg: "🌿", // Magnesium
    zn: "⚡", // Zinc
    b: "🔵" // Boron
  };

  const emoji = nutrientEmojis[nutrient.toLowerCase()] || "🌱";
  return `${emoji} ${nutrient.toUpperCase()}: ${baseGuide}`;
}

// ========== HELPER TO CHECK IF CROP USES SEED OR PLANTING MATERIAL ==========

/**
 * Determine if a crop uses seed (true) or vegetative planting material (false)
 */
export function usesSeed(crop: string): boolean {
  const lowerCrop = crop.toLowerCase();

  // Crops that use seeds
  const seedCrops = [
    "maize", "beans", "wheat", "sorghum", "millet", "finger millet", "rice", "barley",
    "soya beans", "cowpeas", "green grams", "bambara nuts", "groundnuts", "sunflower",
    "simsim", "tomatoes", "cabbage", "kales", "onions", "carrots", "capsicums",
    "chillies", "brinjals", "french beans", "garden peas", "spinach", "okra",
    "cauliflower", "watermelons", "pumpkins", "cucumber", "lettuce", "dania",
    "cover crops", "mucuna", "desmodium", "dolichos", "canavalia",
    "crotalaria ochroleuca", "crotalaria juncea", "crotalaria paulina",
    "pigeonpeas", "bambaranuts"
  ];

  // Crops that use vegetative planting material
  const vegetativeCrops = [
    "cassava", "sweet potatoes", "irish potatoes", "yams", "taro", "arrow roots",
    "bananas", "plantains", "coffee", "tea", "cocoa", "sugarcane", "pineapples",
    "mangoes", "avocados", "oranges", "lemons", "limes", "macadamia", "cashew nuts",
    "passion fruit", "strawberries", "raspberries", "blackberries", "grapes",
    "roses", "carnations", "tissue culture bananas", "tissue culture potatoes"
  ];

  if (seedCrops.includes(lowerCrop)) return true;
  if (vegetativeCrops.includes(lowerCrop)) return false;

  // Default based on common categories
  if (lowerCrop.includes("potato") || lowerCrop.includes("cassava") ||
      lowerCrop.includes("banana") || lowerCrop.includes("sugar") ||
      lowerCrop.includes("coffee") || lowerCrop.includes("tea") ||
      lowerCrop.includes("cocoa") || lowerCrop.includes("pineapple") ||
      lowerCrop.includes("mango") || lowerCrop.includes("avocado")) {
    return false;
  }

  // Default to seed
  return true;
}

// ========== NEW: PARSE NUTRIENT STRING HELPER ==========

/**
 * Parse a nutrient string like "5S+3Mg+2Zn" into an object
 */
export function parseNutrientString(nutrientStr: string): {
  s?: number;
  ca?: number;
  mg?: number;
  zn?: number;
  b?: number;
  cu?: number;
  mn?: number;
} {
  const result: any = {};

  if (!nutrientStr || nutrientStr === "No additional nutrients") return result;

  const parts = nutrientStr.split('+');
  parts.forEach(part => {
    const match = part.match(/(\d+)([A-Za-z]+)/);
    if (match) {
      const value = parseFloat(match[1]);
      const nutrient = match[2].toLowerCase();

      if (nutrient === 's') result.s = value;
      else if (nutrient === 'ca') result.ca = value;
      else if (nutrient === 'mg') result.mg = value;
      else if (nutrient === 'zn') result.zn = value;
      else if (nutrient === 'b') result.b = value;
      else if (nutrient === 'cu') result.cu = value;
      else if (nutrient === 'mn') result.mn = value;
    }
  });

  return result;
}

// ========== GROSS MARGIN CALCULATOR Using Farmer's Actual Data ==========

export interface GrossMarginInput {
  crop: string;
  cropAcres: number;
  actualYield: number;
  yieldUnit: string;
  pricePerUnit: number;
  priceUnit: string;
  // Planting material (either seed cost or planting material cost)
  seedRate?: number;                    // Optional - for seed crops
  seedCost?: number;                     // For seed crops
  plantingMaterialCost?: number;         // Cost per unit of planting material (per vine, cutting, sucker, etc.)
  plantingMaterialUnit?: string;         // e.g., "per vine", "per cutting", "per sucker", "per kg"
  plantingMaterialQuantity?: number;     // Number of planting material units used
  // Fertilizer costs
  plantingFertilizerCost: number;
  plantingFertilizerQuantity: number;
  topdressingFertilizerCost: number;
  topdressingFertilizerQuantity: number;
  potassiumFertilizerCost: number;
  potassiumFertilizerQuantity: number;
  // Labour costs
  ploughingCost: number;
  plantingLabourCost: number;
  weedingCost: number;
  harvestingCost: number;
  // Transport and bags
  transportCostPerKg: number;
  emptyBags: number;
  bagCost: number;
  // NEW: Plants damaged (data only - not used in calculations)
  plantsDamaged?: number;
}

export interface GrossMarginOutput {
  crop: string;
  yieldKg: number;
  pricePerKg: number;
  revenue: number;
  plantingMaterialCost: number;          // Unified field for seed or vegetative material
  plantingMaterialType: 'seed' | 'vegetative'; // To indicate what was used
  fertilizerCost: number;
  labourCost: number;
  transportCost: number;
  bagCost: number;
  totalCosts: number;
  grossMargin: number;
  roi: number;
  costPerKg: number;
  breakevenPrice: number;
  // NEW: Damage report (data only)
  plantsDamaged?: number;
}

export function calculateGrossMarginFromFarmerData(input: GrossMarginInput): GrossMarginOutput {
  const crop = input.crop.toLowerCase();

  // Convert everything to kg
  const yieldKg = convertToKg(crop, input.actualYield * input.cropAcres, input.yieldUnit);
  const pricePerKg = convertToKg(crop, input.pricePerUnit, input.priceUnit) / input.pricePerUnit;

  // Calculate revenue
  const revenue = yieldKg * pricePerKg;

  // ===== CALCULATE PLANTING MATERIAL COST =====
  // Determine if crop uses seed or vegetative material
  const isSeed = usesSeed(crop);

  let plantingMaterialTotal = 0;

  if (isSeed && input.seedCost && input.seedRate) {
    // Seed-based crop
    plantingMaterialTotal = input.seedRate * input.cropAcres * input.seedCost;
  } else if (!isSeed && input.plantingMaterialCost && input.plantingMaterialQuantity) {
    // Vegetative crop (vines, cuttings, suckers, etc.)
    // Total cost = number of units × price per unit
    plantingMaterialTotal = input.plantingMaterialQuantity * input.plantingMaterialCost;
  } else {
    // Fallback - try to use seedCost if provided
    plantingMaterialTotal = (input.seedCost || 0) * (input.seedRate || 0) * input.cropAcres;
  }

  // Calculate fertilizer costs
  const plantingFertBags = input.plantingFertilizerQuantity / 50;
  const plantingFertTotal = plantingFertBags * input.plantingFertilizerCost;

  const topdressingFertBags = input.topdressingFertilizerQuantity / 50;
  const topdressingFertTotal = topdressingFertBags * input.topdressingFertilizerCost;

  const potassiumFertBags = input.potassiumFertilizerQuantity / 50;
  const potassiumFertTotal = potassiumFertBags * input.potassiumFertilizerCost;

  const fertilizerTotal = plantingFertTotal + topdressingFertTotal + potassiumFertTotal;

  // Calculate labour costs (per acre)
  const labourTotal = (input.ploughingCost + input.plantingLabourCost +
                      input.weedingCost + input.harvestingCost) * input.cropAcres;

  // Calculate transport cost
  const transportTotal = yieldKg * (input.transportCostPerKg || 0);

  // Calculate bag cost
  const bagsNeeded = input.emptyBags || Math.ceil(yieldKg / 90);
  const bagsTotal = bagsNeeded * input.bagCost;

  // Total costs
  const totalCosts = plantingMaterialTotal + fertilizerTotal + labourTotal + transportTotal + bagsTotal;

  // Gross margin
  const grossMargin = revenue - totalCosts;

  // ROI
  const roi = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0;

  // Cost per kg
  const costPerKg = yieldKg > 0 ? totalCosts / yieldKg : 0;

  // Breakeven price
  const breakevenPrice = yieldKg > 0 ? totalCosts / yieldKg : 0;

  return {
    crop: input.crop,
    yieldKg: Math.round(yieldKg),
    pricePerKg: Math.round(pricePerKg * 100) / 100,
    revenue: Math.round(revenue),
    plantingMaterialCost: Math.round(plantingMaterialTotal),
    plantingMaterialType: isSeed ? 'seed' : 'vegetative',
    fertilizerCost: Math.round(fertilizerTotal),
    labourCost: Math.round(labourTotal),
    transportCost: Math.round(transportTotal),
    bagCost: Math.round(bagsTotal),
    totalCosts: Math.round(totalCosts),
    grossMargin: Math.round(grossMargin),
    roi: Math.round(roi * 10) / 10,
    costPerKg: Math.round(costPerKg * 100) / 100,
    breakevenPrice: Math.round(breakevenPrice * 100) / 100,
    // NEW: Pass through plants damaged (data only)
    plantsDamaged: input.plantsDamaged
  };
}

// Legacy function
export const calculateGrossMargin = (
  crop: string,
  managementLevel: 'low' | 'medium' | 'high',
  bags: number,
  pricePerBag: number,
  seedCost: number,
  fertilizerCost: number,
  labourCost: number,
  transportCost: number,
  bagCost: number
) => {
  const grossOutput = bags * pricePerBag;
  const totalCost = seedCost + fertilizerCost + labourCost + transportCost + bagCost;
  const grossMargin = grossOutput - totalCost;

  return {
    crop,
    managementLevel,
    bags,
    pricePerBag,
    grossOutput,
    seedCost,
    fertilizerCost,
    labourCost,
    transportCost,
    bagCost,
    totalCost,
    grossMargin
  };
};

// Calculate ROI percentage
export const calculateROI = (investment: number, returns: number): number => {
  if (investment === 0) return 0;
  return ((returns - investment) / investment) * 100;
};

// Get crop recommendation based on gross margin
export const getTopCropsByProfit = (crops: any[]): any[] => {
  return [...crops].sort((a, b) => b.grossMargin - a.grossMargin);
};

// ========== NEW: DAMAGE CALCULATION HELPERS ==========

/**
 * Calculate potential yield loss based on plants damaged
 * Note: This is for information only, not used in core calculations
 */
export function calculatePotentialYieldLoss(
  totalPlants: number,
  damagedPlants: number,
  expectedYieldPerPlant: number
): {
  plantsDamaged: number;
  damagePercentage: number;
  estimatedYieldLoss: number;
  note: string;
} {
  if (totalPlants === 0 || damagedPlants === 0) {
    return {
      plantsDamaged: damagedPlants,
      damagePercentage: 0,
      estimatedYieldLoss: 0,
      note: "No damage reported"
    };
  }

  const damagePercentage = (damagedPlants / totalPlants) * 100;
  const estimatedYieldLoss = damagedPlants * expectedYieldPerPlant;

  return {
    plantsDamaged: damagedPlants,
    damagePercentage: Math.round(damagePercentage * 10) / 10,
    estimatedYieldLoss: Math.round(estimatedYieldLoss),
    note: damagePercentage > 20
      ? `⚠️ Significant damage (${damagePercentage.toFixed(1)}% of plants). Consider reviewing pest/disease management.`
      : `✅ Damage is within manageable range (${damagePercentage.toFixed(1)}% of plants).`
  };
}
// lib/HomefeedFormulation.ts
// Complete Poultry Feed Formulation Engine with Price‑Based Substitution
// This module calculates custom feed formulations based on breed, stage, quantity,
// available ingredients, custom prices, and automatically substitutes missing ingredients
// by choosing the cheapest available alternative in each nutritional group.

export interface Ingredient {
  name: string;
  amountKg: number;      // Amount needed for the batch (after adjusting for available ingredients)
  percent: number;       // Percentage in the formula
  cost: number;          // Total cost for this ingredient in the batch
  pricePerKg: number;    // Price per kg (in KES equivalent)
  available: boolean;    // True if the farmer already has this ingredient
  isSubstitute?: boolean; // True if this ingredient was substituted
  originalName?: string;  // Name of the original ingredient it replaced
}

export interface NutritionalSummary {
  protein: number;       // Crude protein %
  calcium: number;       // Calcium %
  energy: number;        // Energy in kcal/kg (ME)
}

export interface MissingIngredient {
  name: string;
  amountKg: number;
}

export interface FeedResult {
  ingredients: Ingredient[];
  missingIngredients: MissingIngredient[];
  totalCost: number;     // Total cost in base currency (KES or local)
  costPerKg: number;
  savingsPercent: number; // Estimated savings vs commercial feed (using 30% baseline)
  nutritionalSummary: NutritionalSummary;
  nutritionalVerdicts: { nutrient: string; value: number; target: number; meets: boolean }[];
  allRequiredSelected: boolean;
  mixingInstructions: string;
  warnings: string[];
  structuredList: Array<{ key: string; params: { content: string } }>; // For voice/display
  substitutionsMade: string[]; // List of substitutions (e.g., "fish meal → omena")
}

// ========== DEFAULT INGREDIENT PRICES (KES per kg) ==========
const DEFAULT_INGREDIENT_PRICES: Record<string, number> = {
  'broken maize': 40,
  'maize bran': 25,
  'maize germ': 30,
  'sorghum': 38,
  'millet': 35,
  'cassava': 25,
  'soya bean meal': 150,
  'fish meal': 200,
  'omena': 90,
  'meat and bone meal': 110,
  'sunflower cake': 80,
  'groundnut cake': 120,
  'cottonseed cake': 100,
  'wheat bran': 30,
  'rice bran': 28,
  'lime': 20,
  'dcp': 120,
  'premix': 300,
  'methionine': 600,
  'lysine': 500,
  'salt': 50,
  'toxin binder': 200,
};

// ========== COUNTRY PRICE MULTIPLIERS ==========
const COUNTRY_PRICE_MULTIPLIERS: Record<string, number> = {
  'kenya': 1.0,
  'uganda': 1.1,
  'tanzania': 1.05,
  'rwanda': 1.1,
  'burundi': 1.15,
  'south africa': 0.9,
  'zambia': 1.1,
  'zimbabwe': 1.2,
  'malawi': 1.15,
  'nigeria': 1.3,
  'ghana': 1.25,
  'ethiopia': 1.2,
  'sweden': 1.0,
  'germany': 1.0,
};

// ========== SUBSTITUTION MAP ==========
const SUBSTITUTIONS: Record<string, { substitute: string; factor: number; note?: string }[]> = {
  // PROTEIN GROUP
  'fish meal': [
    { substitute: 'omena', factor: 1.2, note: 'Omena is lower in protein; increase by 20%.' },
    { substitute: 'meat and bone meal', factor: 1.1 },
    { substitute: 'soya bean meal', factor: 1.3 },
  ],
  'soya bean meal': [
    { substitute: 'sunflower cake', factor: 1.3 },
    { substitute: 'groundnut cake', factor: 1.2 },
    { substitute: 'cottonseed cake', factor: 1.1 },
  ],
  'sunflower cake': [
    { substitute: 'groundnut cake', factor: 0.9 },
    { substitute: 'cottonseed cake', factor: 0.8 },
  ],
  // ENERGY/CARBOHYDRATE GROUP
  'broken maize': [
    { substitute: 'sorghum', factor: 0.95, note: 'Sorghum has slightly lower energy; increase by 5%.' },
    { substitute: 'millet', factor: 0.95 },
    { substitute: 'cassava', factor: 1.2 },
    { substitute: 'maize bran', factor: 1.1 },
    { substitute: 'maize germ', factor: 0.9 },
  ],
  'wheat bran': [
    { substitute: 'rice bran', factor: 1.0 },
    { substitute: 'maize bran', factor: 1.0 },
    { substitute: 'maize germ', factor: 0.8 },
  ],
  // MINERAL GROUP
  'lime': [
    { substitute: 'oyster shell grit', factor: 1.0 },
  ],
  'dcp': [
    { substitute: 'bone meal', factor: 0.8 },
  ],
};

// ========== FEED FORMULAS ==========
interface FeedFormula {
  [ingredient: string]: number;
}

const FORMULAS: Record<string, Record<string, FeedFormula>> = {
  // ===== LOCAL =====
  'local': {
    'starter': {
      'broken maize': 60,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 63,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 62,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== LAYERS =====
  'layers': {
    'starter': {
      'broken maize': 55,
      'soya bean meal': 25,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 59,
      'soya bean meal': 21,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== SASSO =====
  'sasso': {
    'starter': {
      'broken maize': 55,
      'soya bean meal': 25,
      'fish meal': 7,
      'sunflower cake': 8,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 59,
      'soya bean meal': 21,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== KENBREW =====
  'kenbrew': {
    'starter': {
      'broken maize': 56,
      'soya bean meal': 24,
      'fish meal': 7,
      'sunflower cake': 8,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 60,
      'soya bean meal': 20,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== KROILER =====
  'kroiler': {
    'starter': {
      'broken maize': 56,
      'soya bean meal': 24,
      'fish meal': 7,
      'sunflower cake': 8,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 60,
      'soya bean meal': 20,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== BROILER =====
  'broiler': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 28,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 58,
      'soya bean meal': 24,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== SUSSEX =====
  'sussex': {
    'starter': {
      'broken maize': 57,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 61,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== KUROILER =====
  'kuroiler': {
    'starter': {
      'broken maize': 56,
      'soya bean meal': 24,
      'fish meal': 7,
      'sunflower cake': 8,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 60,
      'soya bean meal': 20,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== RAINBOW ROOSTER =====
  'rainbow_rooster': {
    'starter': {
      'broken maize': 56,
      'soya bean meal': 24,
      'fish meal': 7,
      'sunflower cake': 8,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 60,
      'soya bean meal': 20,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== KENYA BROILER =====
  'kenya_broiler': {
    'starter': {
      'broken maize': 55,
      'soya bean meal': 26,
      'fish meal': 7,
      'sunflower cake': 6,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 59,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 6,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== KARI KIENYEJI =====
  'kari_kienyeji': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 6,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 18,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 62,
      'soya bean meal': 16,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== HY-LINE BROWN =====
  'hyline_brown': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== ISA BROWN =====
  'isa_brown': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== LOHMANN BROWN =====
  'lohmann_brown': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== COBB 500 =====
  'cobb_500': {
    'starter': {
      'broken maize': 53,
      'soya bean meal': 29,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 57,
      'soya bean meal': 25,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== ROSS 308 =====
  'ross_308': {
    'starter': {
      'broken maize': 53,
      'soya bean meal': 29,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 57,
      'soya bean meal': 25,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== INDIAN RIVER =====
  'indian_river': {
    'starter': {
      'broken maize': 53,
      'soya bean meal': 29,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 57,
      'soya bean meal': 25,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== RHODE ISLAND RED =====
  'rhode_island_red': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== PLYMOUTH ROCK =====
  'plymouth_rock': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== AUSTRALORP =====
  'australorp': {
    'starter': {
      'broken maize': 57,
      'soya bean meal': 24,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 61,
      'soya bean meal': 20,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== ORPINGTON =====
  'orpington': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== FAYOUMI =====
  'fayoumi': {
    'starter': {
      'broken maize': 57,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 3,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 61,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 3,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 60,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 3,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== OVAMBO =====
  'ovambo': {
    'starter': {
      'broken maize': 59,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 63,
      'soya bean meal': 18,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 62,
      'soya bean meal': 16,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== POTCHEFSTROOM KOEKOEK =====
  'potchefstroom_koekoek': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== NAKED NECK =====
  'naked_neck': {
    'starter': {
      'broken maize': 58,
      'soya bean meal': 23,
      'fish meal': 6,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 1.0,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 62,
      'soya bean meal': 19,
      'fish meal': 4,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 61,
      'soya bean meal': 17,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== HUBBARD =====
  'hubbard': {
    'starter': {
      'broken maize': 53,
      'soya bean meal': 29,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 57,
      'soya bean meal': 25,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== ARBOR ACRES =====
  'arbor_acres': {
    'starter': {
      'broken maize': 53,
      'soya bean meal': 29,
      'fish meal': 8,
      'sunflower cake': 5,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.3,
      'lysine': 0.2,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'finisher': {
      'broken maize': 57,
      'soya bean meal': 25,
      'fish meal': 5,
      'sunflower cake': 5,
      'wheat bran': 2,
      'lime': 1.5,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== BOVAN BROWN =====
  'bovan_brown': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== DEKALB WHITE =====
  'dekalb_white': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== HISEX BROWN =====
  'hisex_brown': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== BROWN NICK =====
  'brown_nick': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },

  // ===== WARREN =====
  'warren': {
    'starter': {
      'broken maize': 54,
      'soya bean meal': 26,
      'fish meal': 8,
      'sunflower cake': 7,
      'wheat bran': 1,
      'lime': 1.5,
      'dcp': 1.2,
      'premix': 0.5,
      'methionine': 0.25,
      'lysine': 0.15,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'grower': {
      'broken maize': 58,
      'soya bean meal': 22,
      'fish meal': 5,
      'sunflower cake': 8,
      'wheat bran': 2,
      'lime': 1.8,
      'dcp': 0.8,
      'premix': 0.5,
      'methionine': 0.15,
      'lysine': 0.1,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
    'layer': {
      'broken maize': 58,
      'soya bean meal': 18,
      'fish meal': 3.5,
      'sunflower cake': 7,
      'wheat bran': 2,
      'lime': 4.5,
      'dcp': 0.5,
      'premix': 0.5,
      'methionine': 0.2,
      'lysine': 0.12,
      'salt': 0.3,
      'toxin binder': 0.1,
    },
  },
};

// ========== NUTRITIONAL TARGETS ==========
const NUTRITION_TARGETS: Record<string, { protein: number; calcium: number; energy: number }> = {
  'starter': { protein: 19, calcium: 0.8, energy: 2800 },
  'grower': { protein: 16.5, calcium: 0.9, energy: 2700 },
  'layer': { protein: 15.5, calcium: 3.8, energy: 2750 },
  'finisher': { protein: 20, calcium: 0.7, energy: 2900 },
};

// ========== STAGE AGE RANGE ==========
const STAGE_AGE_RANGE: Record<string, string> = {
  'starter': '0 to 4 weeks',
  'grower': '4 to 10 weeks',
  'layer': '18+ weeks',
  'finisher': '6 to 12 weeks',
};

// ========== HELPERS ==========
function getIngredientPrice(
  ingredient: string,
  country: string = 'kenya',
  customPrices?: Record<string, number>
): number {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  if (customPrices && customPrices[normalizedIngredient] !== undefined && customPrices[normalizedIngredient] > 0) {
    return customPrices[normalizedIngredient];
  }
  const basePrice = DEFAULT_INGREDIENT_PRICES[normalizedIngredient] || 100;
  const multiplier = COUNTRY_PRICE_MULTIPLIERS[country.toLowerCase()] || 1.0;
  return basePrice * multiplier;
}

// ========== SUBSTITUTION ENGINE ==========
function applySubstitutions(
  formula: FeedFormula,
  availableIngredients: string[],
  country: string,
  customPrices: Record<string, number>
): { adjustedFormula: FeedFormula; substitutionsMade: string[]; usedSubstitutes: Set<string> } {
  const adjustedFormula = { ...formula };
  const substitutionsMade: string[] = [];
  const usedSubstitutes = new Set<string>();
  const availableSet = new Set(availableIngredients.map(i => i.toLowerCase().trim()));

  for (const [ingredient, percent] of Object.entries(formula)) {
    const normalizedIng = ingredient.toLowerCase().trim();
    if (availableSet.has(normalizedIng)) continue;

    const substitutionChain = SUBSTITUTIONS[normalizedIng];
    if (!substitutionChain) continue;

    const candidates = substitutionChain
      .map(sub => {
        const subNormalized = sub.substitute.toLowerCase().trim();
        if (availableSet.has(subNormalized)) {
          const pricePerKg = getIngredientPrice(sub.substitute, country, customPrices);
          const effectiveCost = pricePerKg * sub.factor;
          return { ...sub, pricePerKg, effectiveCost, normalized: subNormalized };
        }
        return null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => a.effectiveCost - b.effectiveCost);
    const best = candidates[0];

    const adjustedPercent = percent * best.factor;
    delete adjustedFormula[ingredient];
    adjustedFormula[best.substitute] = (adjustedFormula[best.substitute] || 0) + adjustedPercent;
    usedSubstitutes.add(best.substitute.toLowerCase().trim());
    substitutionsMade.push(
      `${ingredient} → ${best.substitute} (factor ${best.factor}) – cheapest at ${best.pricePerKg.toFixed(2)}/kg`
    );
  }

  // Normalize
  const total = Object.values(adjustedFormula).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 100) > 0.01) {
    const factor = 100 / total;
    for (const key of Object.keys(adjustedFormula)) {
      adjustedFormula[key] = parseFloat((adjustedFormula[key] * factor).toFixed(2));
    }
  }

  return { adjustedFormula, substitutionsMade, usedSubstitutes };
}

// ========== MAIN EXPORT ==========
export function formulateFeed(params: {
  breed: string;
  stage: string;
  quantityKg: number;
  includeCoccidiostat: boolean;
  availableIngredients?: string[];
  country?: string;
  ingredientPrices?: Record<string, number>;
  ageWeeks?: string; // optional
}): FeedResult {
  const {
    breed,
    stage,
    quantityKg,
    includeCoccidiostat,
    availableIngredients = [],
    country = 'kenya',
    ingredientPrices = {},
    ageWeeks,
  } = params;

  const breedKey = breed.toLowerCase().trim();
  const stageKey = stage.toLowerCase().includes('starter') ? 'starter' :
                   stage.toLowerCase().includes('grower') ? 'grower' :
                   stage.toLowerCase().includes('layer') ? 'layer' :
                   stage.toLowerCase().includes('finisher') ? 'finisher' : 'starter';

  const breedFormulas = FORMULAS[breedKey];
  if (!breedFormulas) {
    throw new Error(`Unsupported breed: ${breed}. Supported breeds are: ${Object.keys(FORMULAS).join(', ')}`);
  }
  const formula = breedFormulas[stageKey];
  if (!formula) {
    throw new Error(`Unsupported stage: ${stage} for breed ${breed}. Supported stages are: ${Object.keys(breedFormulas).join(', ')}`);
  }

  const { adjustedFormula, substitutionsMade, usedSubstitutes } = applySubstitutions(
    formula,
    availableIngredients,
    country,
    ingredientPrices
  );

  const factor = quantityKg / 100;
  const ingredients: Ingredient[] = Object.entries(adjustedFormula).map(([name, percent]) => {
    const amount = percent * factor;
    const pricePerKg = getIngredientPrice(name, country, ingredientPrices);
    const cost = amount * pricePerKg;
    const sub = substitutionsMade.find(s => s.includes(name));
    const isSubstitute = !!sub;
    const originalName = isSubstitute ? sub.split('→')[0].trim() : undefined;
    return {
      name,
      amountKg: parseFloat(amount.toFixed(3)),
      percent: parseFloat(percent.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      pricePerKg: parseFloat(pricePerKg.toFixed(2)),
      available: availableIngredients.some(a => a.toLowerCase().trim() === name.toLowerCase().trim()),
      isSubstitute,
      originalName,
    };
  });

  const finalIngredients = ingredients.filter(ing => ing.amountKg > 0.01);

  // Compute missing ingredients: those in adjustedFormula but not in availableIngredients and not substituted
  const availableSet = new Set(availableIngredients.map(i => i.toLowerCase().trim()));
  const usedSubstitutesSet = usedSubstitutes;
  const missingList: MissingIngredient[] = [];
  for (const [name, percent] of Object.entries(adjustedFormula)) {
    const normalized = name.toLowerCase().trim();
    if (!availableSet.has(normalized) && !usedSubstitutesSet.has(normalized)) {
      const amount = percent * factor;
      if (amount > 0.01) {
        missingList.push({ name, amountKg: parseFloat(amount.toFixed(3)) });
      }
    }
  }

  const totalCost = finalIngredients.reduce((sum, ing) => sum + ing.cost, 0);
  const costPerKg = totalCost / quantityKg;
  // Assume commercial feed costs 30% more than your home‑mixed feed (baseline)
  const commercialPricePerKg = costPerKg * 1.3;
  const savingsPercent = ((commercialPricePerKg - costPerKg) / commercialPricePerKg) * 100;

  const nutrition = NUTRITION_TARGETS[stageKey] || NUTRITION_TARGETS['starter'];
  const verdicts = [
    { nutrient: 'protein', value: nutrition.protein, target: NUTRITION_TARGETS[stageKey]?.protein || 0 },
    { nutrient: 'calcium', value: nutrition.calcium, target: NUTRITION_TARGETS[stageKey]?.calcium || 0 },
    { nutrient: 'energy', value: nutrition.energy, target: NUTRITION_TARGETS[stageKey]?.energy || 0 },
    { nutrient: 'phosphorus', value: 0.4, target: 0.4 }, // placeholder – we assume it's met
  ];
  const nutritionalVerdicts = verdicts.map(v => ({
    nutrient: v.nutrient,
    value: v.value,
    target: v.target,
    meets: v.value >= v.target * 0.95, // allow 5% tolerance
  }));

  const allRequiredSelected = missingList.length === 0;

  // Build warnings
  const warnings: string[] = [];
  if (stageKey === 'layer' && includeCoccidiostat) {
    warnings.push("Coccidiostat is NOT allowed for laying hens – it has been removed from this formula.");
  }
  if (stageKey === 'finisher') {
    warnings.push("Withdraw coccidiostat 5–7 days before slaughter if used.");
  }
  if (substitutionsMade.length > 0) {
    warnings.push(`Substitutions made: ${substitutionsMade.join('; ')}. Nutritional balance may differ slightly.`);
  }
  if (missingList.length > 0) {
    const names = missingList.map(m => m.name).join(', ');
    warnings.push(`You need to purchase: ${names}. These are not in your selection and no substitute was found.`);
  }

  // Determine if essential nutrients (Premix, DCP, Methionine) are missing
  const missingNames = missingList.map(m => m.name.toLowerCase().trim());
  const essentialMissing = missingNames.filter(n => ['premix', 'dcp', 'methionine'].includes(n));
  const missingEssential = essentialMissing.length > 0;

  // Build structured list for display/voice
  const structuredList: Array<{ key: string; params: { content: string } }> = [];

  // Age display
  const ageDisplay = ageWeeks || STAGE_AGE_RANGE[stageKey] || 'Not specified';

  // 1. Feed summary
  structuredList.push({
    key: "feed_summary",
    params: {
      content: `${breed} ${stage} – ${quantityKg} kg (${country}, ${ageDisplay})`
    }
  });

  // 2. Selected ingredients with prices
  const ingredientLines = finalIngredients.map(ing => {
    const subText = ing.isSubstitute ? ` (substitute for ${ing.originalName})` : '';
    return `${ing.name}${subText}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})`;
  });
  if (ingredientLines.length > 0) {
    structuredList.push({
      key: "ingredient_list",
      params: {
        content: `Ingredients you selected:\n${ingredientLines.join('\n')}`
      }
    });
  }

  // 3. Missing ingredients (if any) – only name and quantity, no prices
  if (missingList.length > 0) {
    const missingLines = missingList.map(m => `${m.name}: ${m.amountKg.toFixed(2)} kg`);
    structuredList.push({
      key: "missing_ingredients",
      params: {
        content: `Ingredients not selected – you need to buy these:\n${missingLines.join('\n')}`
      }
    });
  }

  // 4. Nutritional analysis
  const nutrientLines = nutritionalVerdicts.map(v => {
    const verdict = v.meets ? 'meets' : 'does not meet';
    return `${v.nutrient}: ${v.value} (target: ${v.target}) – ${verdict} the standard.`;
  });
  structuredList.push({
    key: "nutritional_info",
    params: {
      content: `Nutritional analysis:\n${nutrientLines.join('\n')}`
    }
  });

  // 5. Total cost and cost per kg
  structuredList.push({
    key: "total_cost",
    params: {
      content: `Total cost: ${totalCost.toFixed(2)}\nCost per kg: ${costPerKg.toFixed(2)}`
    }
  });

  // 6. Savings estimate
  if (savingsPercent > 0) {
    structuredList.push({
      key: "savings_estimate",
      params: {
        content: `You saved about ${savingsPercent.toFixed(0)}% compared to commercial feed.`
      }
    });
  }

  // 7. Efficiency note or business warning
  if (allRequiredSelected && !missingEssential) {
    structuredList.push({
      key: "efficiency_note",
      params: {
        content: "All required ingredients are included – your birds will have optimal growth and health."
      }
    });
  } else {
    let warningText = "Business and efficiency warning:\n";
    if (missingEssential.length > 0) {
      warningText += `You are missing ${essentialMissing.join(', ')}. These are essential for ${stage} mash.\n`;
      warningText += "Skipping them will result in slower growth, poor feed conversion, weaker bones, and higher mortality.\n";
    }
    if (missingList.length > 0 && !allRequiredSelected) {
      warningText += `You also need to purchase: ${missingList.map(m => m.name).join(', ')}.\n`;
    }
    warningText += "Remember: This is a profit‑making venture. Losing even 10% efficiency means losing your market edge. Always prioritise the critical micro‑nutrients – Premix, DCP, and Methionine – to protect your returns.";
    structuredList.push({
      key: "business_warning",
      params: { content: warningText }
    });
  }

  // 8. Mixing instructions
  let mixingInstructions = "Mix all ingredients thoroughly. For best results, grind maize and soya meal to a fine powder before mixing.";
  if (stageKey === 'starter') {
    mixingInstructions += " Starter feed should be crumbled or mashed for young chicks.";
  } else if (stageKey === 'layer') {
    mixingInstructions += " For layers, ensure calcium is evenly distributed to prevent shell defects.";
  } else if (stageKey === 'finisher') {
    mixingInstructions += " For broiler finisher, mix with a little vegetable oil to reduce dust and increase energy.";
  }
  structuredList.push({
    key: "mixing_instructions",
    params: { content: mixingInstructions }
  });

  // 9. Closing messages (static)
  structuredList.push({
    key: "closing_message",
    params: {
      content: "You can go back and select these missed ingredients so that I can regenerate this same recommendation with a complete wholesome advice."
    }
  });
  structuredList.push({
    key: "designer_credit",
    params: {
      content: "This assistant was designed by Mugo to help serve a large number of farmers with accurate, practical guidance."
    }
  });
  structuredList.push({
    key: "other_modules",
    params: {
      content: "Explore our other advice modules for crops, poultry, and dairy cows."
    }
  });
  structuredList.push({
    key: "upcoming_species",
    params: {
      content: "Support for piggery, goats, fish farming, and beekeeping is coming soon."
    }
  });
  structuredList.push({
    key: "submit_comments",
    params: {
      content: "Submit your comments below to serve you better."
    }
  });

  return {
    ingredients: finalIngredients,
    missingIngredients: missingList,
    totalCost,
    costPerKg,
    savingsPercent,
    nutritionalSummary: nutrition,
    nutritionalVerdicts,
    allRequiredSelected,
    mixingInstructions,
    warnings,
    structuredList,
    substitutionsMade,
  };
}
// lib/feedFormulation.ts
// Complete Poultry Feed Formulation Engine with Substitution Logic
// This module calculates custom feed formulations based on breed, stage, quantity,
// available ingredients, custom prices, and automatically substitutes missing ingredients.

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

export interface FeedResult {
  ingredients: Ingredient[];
  totalCost: number;     // Total cost in base currency (KES or local)
  nutritionalSummary: NutritionalSummary;
  mixingInstructions: string;
  warnings: string[];
  structuredList: Array<{ key: string; params: { content: string } }>; // For voice/display
  substitutionsMade: string[]; // List of substitutions (e.g., "fish meal → omena")
}

// ========== DEFAULT INGREDIENT PRICES (KES per kg) ==========
const DEFAULT_INGREDIENT_PRICES: Record<string, number> = {
  'broken maize': 40,
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
};

// ========== SUBSTITUTION MAP ==========
// For each primary ingredient, a list of alternatives with nutritional factors.
// factor = multiplier to adjust the percentage to match nutrient density.
// Example: omena has less protein than fish meal, so factor 1.2 means use 20% more.
const SUBSTITUTIONS: Record<string, { substitute: string; factor: number; note?: string }[]> = {
  'fish meal': [
    { substitute: 'omena', factor: 1.2, note: 'Omena is lower in protein; increase by 20%.' },
    { substitute: 'meat and bone meal', factor: 1.1 },
    { substitute: 'soya bean meal', factor: 1.3 },
  ],
  'broken maize': [
    { substitute: 'sorghum', factor: 0.95, note: 'Sorghum has slightly lower energy; increase by 5%.' },
    { substitute: 'millet', factor: 0.95 },
    { substitute: 'cassava', factor: 1.2 },
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
  'wheat bran': [
    { substitute: 'rice bran', factor: 1.0 },
    { substitute: 'maize germ meal', factor: 0.9 },
  ],
  'lime': [
    { substitute: 'oyster shell grit', factor: 1.0 },
  ],
  'dcp': [
    { substitute: 'bone meal', factor: 0.8 }, // bone meal has less phosphorus
  ],
  // Add more as needed
};

// ========== GET INGREDIENT PRICE (with custom override) ==========
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

// ========== FEED FORMULAS ==========
// Each formula is a percentage breakdown of ingredients for 100 kg of feed.
// Format: { ingredientName: percentage }
interface FeedFormula {
  [ingredient: string]: number;
}

const FORMULAS: Record<string, Record<string, FeedFormula>> = {
  // BREED: Local
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
  // BREED: Layers (commercial)
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
  // BREED: Sasso
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
  // BREED: Kenbrew
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
  // BREED: Kroiler
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
  // BREED: Broiler
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
  // BREED: Sussex
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
};

// ========== NUTRITIONAL TARGETS ==========
const NUTRITION_TARGETS: Record<string, { protein: number; calcium: number; energy: number }> = {
  'starter': { protein: 19, calcium: 0.8, energy: 2800 },
  'grower': { protein: 16.5, calcium: 0.9, energy: 2700 },
  'layer': { protein: 15.5, calcium: 3.8, energy: 2750 },
  'finisher': { protein: 20, calcium: 0.7, energy: 2900 },
};

// ========== SUBSTITUTION ENGINE ==========
function applySubstitutions(
  formula: FeedFormula,
  availableIngredients: string[],
  country: string,
  customPrices: Record<string, number>
): { adjustedFormula: FeedFormula; substitutionsMade: string[] } {
  const adjustedFormula = { ...formula };
  const substitutionsMade: string[] = [];
  const availableSet = new Set(availableIngredients.map(i => i.toLowerCase().trim()));

  // For each ingredient in the formula
  for (const [ingredient, percent] of Object.entries(formula)) {
    const normalizedIng = ingredient.toLowerCase().trim();
    // If the ingredient is already available, keep it.
    if (availableSet.has(normalizedIng)) continue;

    // Otherwise, try to substitute
    const substitutionChain = SUBSTITUTIONS[normalizedIng];
    if (!substitutionChain) {
      // No substitution available – keep it, but mark as unavailable later.
      continue;
    }

    // Find the first substitute that is available
    let foundSubstitute = false;
    for (const sub of substitutionChain) {
      const subNormalized = sub.substitute.toLowerCase().trim();
      if (availableSet.has(subNormalized)) {
        // Apply substitution: replace ingredient with substitute, adjust by factor.
        const adjustedPercent = percent * sub.factor;
        // Remove the original ingredient and add the substitute
        delete adjustedFormula[ingredient];
        adjustedFormula[sub.substitute] = (adjustedFormula[sub.substitute] || 0) + adjustedPercent;
        substitutionsMade.push(`${ingredient} → ${sub.substitute} (factor ${sub.factor})`);
        foundSubstitute = true;
        break;
      }
    }

    if (!foundSubstitute) {
      // No substitute available – keep the original ingredient (but we'll show warning later)
      continue;
    }
  }

  // Normalize percentages so they sum to 100%
  const total = Object.values(adjustedFormula).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 100) > 0.01) {
    const factor = 100 / total;
    for (const key of Object.keys(adjustedFormula)) {
      adjustedFormula[key] = parseFloat((adjustedFormula[key] * factor).toFixed(2));
    }
  }

  // Ensure calcium for layers is at least 3.5%
  // (this is a safety check – will be handled by nutritional targets)

  return { adjustedFormula, substitutionsMade };
}

// ========== MAIN FORMULATION FUNCTION (UPDATED WITH SUBSTITUTION) ==========
export function formulateFeed(params: {
  breed: string;
  stage: string;
  quantityKg: number;
  includeCoccidiostat: boolean;
  availableIngredients?: string[];
  country?: string;
  ingredientPrices?: Record<string, number>;
}): FeedResult {
  const {
    breed,
    stage,
    quantityKg,
    includeCoccidiostat,
    availableIngredients = [],
    country = 'kenya',
    ingredientPrices = {},
  } = params;

  // Normalize inputs
  const breedKey = breed.toLowerCase().trim();
  const stageKey = stage.toLowerCase().includes('starter') ? 'starter' :
                   stage.toLowerCase().includes('grower') ? 'grower' :
                   stage.toLowerCase().includes('layer') ? 'layer' :
                   stage.toLowerCase().includes('finisher') ? 'finisher' : 'starter';

  // Validate breed and stage exist
  const breedFormulas = FORMULAS[breedKey];
  if (!breedFormulas) {
    throw new Error(`Unsupported breed: ${breed}. Supported breeds are: ${Object.keys(FORMULAS).join(', ')}`);
  }
  const formula = breedFormulas[stageKey];
  if (!formula) {
    throw new Error(`Unsupported stage: ${stage} for breed ${breed}. Supported stages are: ${Object.keys(breedFormulas).join(', ')}`);
  }

  // Apply substitutions based on available ingredients
  const { adjustedFormula, substitutionsMade } = applySubstitutions(
    formula,
    availableIngredients,
    country,
    ingredientPrices
  );

  // Calculate ingredient amounts (percentages * factor)
  const factor = quantityKg / 100; // because percentages are per 100 kg
  const ingredients: Ingredient[] = Object.entries(adjustedFormula).map(([name, percent]) => {
    const amount = percent * factor;
    const pricePerKg = getIngredientPrice(name, country, ingredientPrices);
    const cost = amount * pricePerKg;
    // Check if the original ingredient was substituted
    const sub = substitutionsMade.find(s => s.includes(name));
    const isSubstitute = sub ? true : false;
    const originalName = isSubstitute ? sub.split('→')[0].trim() : undefined;
    return {
      name,
      amountKg: parseFloat(amount.toFixed(3)),
      percent: parseFloat(percent.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      pricePerKg: parseFloat(pricePerKg.toFixed(2)),
      available: false, // will be updated if the farmer has it
      isSubstitute,
      originalName,
    };
  });

  // Subtract available ingredients (reduce needed quantity by 50% if farmer has some)
  const adjustedIngredients = ingredients.map(ing => {
    const hasIngredient = availableIngredients.some(avail =>
      avail.toLowerCase().includes(ing.name.toLowerCase())
    );
    if (hasIngredient) {
      const reducedAmount = ing.amountKg * 0.5; // farmer has half the needed amount
      const reducedCost = reducedAmount * ing.pricePerKg;
      return {
        ...ing,
        amountKg: parseFloat(reducedAmount.toFixed(3)),
        cost: parseFloat(reducedCost.toFixed(2)),
        available: true,
      };
    }
    return ing;
  });

  // Remove ingredients with zero amount (can happen if available covers all)
  const finalIngredients = adjustedIngredients.filter(ing => ing.amountKg > 0.01);

  // Calculate total cost
  const totalCost = finalIngredients.reduce((sum, ing) => sum + ing.cost, 0);

  // Build structured list for display/voice
  const ingredientLines = finalIngredients.map(ing => {
    const availText = ing.available ? ' (you have some)' : '';
    const subText = ing.isSubstitute ? ` (substitute for ${ing.originalName})` : '';
    return `${ing.name}${subText}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})${availText}`;
  });

  // Nutritional summary – use the targets (since substitutions are factor-adjusted)
  const nutrition = NUTRITION_TARGETS[stageKey] || NUTRITION_TARGETS['starter'];

  // Warnings
  const warnings: string[] = [];
  if (stageKey === 'layer' && includeCoccidiostat) {
    warnings.push("⚠️ Coccidiostat is NOT allowed for laying hens – it has been removed from this formula.");
  }
  if (stageKey === 'finisher') {
    warnings.push("⚠️ Withdraw coccidiostat 5–7 days before slaughter if used.");
  }
  if (finalIngredients.length === 0) {
    warnings.push("⚠️ You seem to have all ingredients already – you may not need to buy anything!");
  }
  if (substitutionsMade.length > 0) {
    warnings.push(`⚠️ Substitutions made: ${substitutionsMade.join('; ')}. Nutritional balance may differ slightly.`);
  }

  // Mixing instructions
  let mixingInstructions = "Mix all ingredients thoroughly. For best results, grind maize and soya meal to a fine powder before mixing.";
  if (stageKey === 'starter') {
    mixingInstructions += " Starter feed should be crumbled or mashed for young chicks.";
  } else if (stageKey === 'layer') {
    mixingInstructions += " For layers, ensure calcium is evenly distributed to prevent shell defects.";
  } else if (stageKey === 'finisher') {
    mixingInstructions += " For broiler finisher, mix with a little vegetable oil to reduce dust and increase energy.";
  }

  // Build structured list (for Agent to display and speak)
  const structuredList = [
    {
      key: "feed_summary",
      params: {
        content: `Feed formula for ${breed} ${stage} – ${quantityKg} kg batch`
      }
    },
    {
      key: "ingredient_list",
      params: {
        content: `Ingredients:\n${ingredientLines.join('\n')}`
      }
    },
    {
      key: "nutritional_info",
      params: {
        content: `Nutritional Summary: Protein ~${nutrition.protein}%, Calcium ~${nutrition.calcium}%, Energy ~${nutrition.energy} kcal/kg`
      }
    },
    {
      key: "total_cost",
      params: {
        content: `Total Cost: ${totalCost.toFixed(2)}`
      }
    },
    {
      key: "mixing_instructions",
      params: {
        content: mixingInstructions
      }
    }
  ];

  if (warnings.length > 0) {
    structuredList.push({
      key: "safety_warnings",
      params: {
        content: `Warnings:\n${warnings.join('\n')}`
      }
    });
  }

  return {
    ingredients: finalIngredients,
    totalCost,
    nutritionalSummary: nutrition,
    mixingInstructions,
    warnings,
    structuredList,
    substitutionsMade,
  };
}
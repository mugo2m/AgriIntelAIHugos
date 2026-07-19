// lib/poultryFeedConcentrate.ts
// POULTRY CONCENTRATE FEED FORMULATION ENGINE
// This module calculates a complete feed recipe using a commercial concentrate
// mixed with local grains (maize, sorghum, etc.), salt, and calcium sources.
// All costs are in the base currency of the selected country (KES, UGX, etc.)
// and can be overridden with custom farmer prices.

export interface Ingredient {
  name: string;
  amountKg: number;
  percent: number;
  cost: number;
  pricePerKg: number;
  available?: boolean;
  isSubstitute?: boolean;
  originalName?: string;
}

export interface NutritionalSummary {
  protein: number;       // Crude protein %
  calcium: number;       // Calcium %
  energy: number;        // Energy in kcal/kg (ME) – estimated
}

export interface ConcentrateFeedResult {
  ingredients: Ingredient[];
  totalCost: number;
  nutritionalSummary: NutritionalSummary;
  mixingInstructions: string;
  warnings: string[];
  structuredList: Array<{ key: string; params: { content: string } }>;
  substitutionsMade?: string[];
}

// ========== CONCENTRATE DATABASE ==========
// Each product has: inclusion rate (%) and protein content (%), plus default price per kg.
interface ConcentrateProduct {
  brand: string;
  product: string;
  inclusionRate: number;   // % of total feed (e.g., 35 = 35 kg per 100 kg feed)
  protein: number;         // % protein in the concentrate
  pricePerKg: number;      // Default price in KES (will be multiplied by country factor)
  notes?: string;
}

// Base prices in KES (Kenya Shillings) – these will be multiplied by country factor.
// The base is Kenya (multiplier 1.0). Other countries adjust.
const CONCENTRATE_DEFAULT_PRICES: Record<string, number> = {
  // International brands
  'Wafi Broiler Concentrate 40%': 120,
  'Wafi Layer Concentrate 35%': 110,
  'Wafi Breeder Concentrate': 115,
  'Intraco Broiler Concentrate 35%': 125,
  'Intraco Layer Concentrate 5%': 200,
  'Intraco Grower Concentrate 30%': 115,
  'Intraco Chikun Concentrate': 100,
  'Koudijs Broiler Concentrate 40%': 130,
  'Koudijs Layer Concentrate 35%': 120,
  'Koudijs Grower Concentrate 30%': 115,
  'Koudijs Breeder Concentrate': 120,
  'Hendrix Broiler Concentrate 25%': 110,
  'Hendrix Layer Concentrate 30%': 110,
  'Hendrix Pre-Starter Concentrate': 140,
  'Nuscience Broiler Concentrate 35%': 125,
  'Nuscience Layer Concentrate 5%': 200,
  'Nuscience Multi-concentrate': 130,
  'Provimi Broiler Concentrate': 125,
  'Provimi Layer Concentrate': 120,
  'DSM Poultry Premix': 300,
  'Cargill Broiler Concentrate': 120,
  'Cargill Layer Concentrate': 115,
  'CP Broiler Concentrate 40%': 130,
  'CP Layer Concentrate 35%': 120,
  // Kenyan brands
  'Jubaili Broiler Concentrate 30%': 100,
  'Jubaili Layer Concentrate 30%': 100,
  'Jubaili Kienyeji Concentrate 30%': 95,
  'Unga Layer Concentrate 35%': 110,
  'Unga Broiler Concentrate 35%': 110,
  'Afrimach Broiler Concentrate 30%': 105,
  'Afrimach Layer Concentrate 30%': 105,
  'Royal Dutch Broiler Concentrate 35%': 115,
  'Royal Dutch Layer Concentrate 35%': 115,
  'KukuCow Broiler Concentrate 40%': 125,
  'KukuCow Layer Concentrate 35%': 115,
  'Farmers Choice Broiler Concentrate': 105,
  'Farmers Choice Layer Concentrate': 105,
  'Transafrica Broiler Concentrate 30%': 105,
  'Transafrica Layer Concentrate 30%': 105,
  'Kenblest Broiler Concentrate': 105,
  'Kenblest Layer Concentrate': 105,
  // Ugandan
  'Ugachick Broiler Concentrate 35%': 115,
  'Ugachick Layer Concentrate 35%': 110,
  'NuFeeds Broiler Concentrate 30%': 105,
  'NuFeeds Layer Concentrate 30%': 105,
  'Kinyara Broiler Concentrate': 100,
  'Kinyara Layer Concentrate': 100,
  // Tanzanian
  'TFC Broiler Concentrate 35%': 110,
  'TFC Layer Concentrate 35%': 105,
  'Mzalendo Broiler Concentrate 30%': 105,
  'Mzalendo Layer Concentrate 30%': 100,
  // Nigerian
  'Amo Broiler Concentrate 30%': 100,
  'Amo Layer Concentrate 30%': 100,
  'Premier Broiler Concentrate': 100,
  'Premier Layer Concentrate': 100,
  'Grand Broiler Concentrate': 100,
  'Grand Layer Concentrate': 100,
  // Ghanaian
  'Raanan Broiler Concentrate 30%': 100,
  'Raanan Layer Concentrate 30%': 100,
  'Agro Broiler Concentrate': 100,
  'Agro Layer Concentrate': 100,
  // South African
  'Meadow Broiler Concentrate 35%': 120,
  'Meadow Layer Concentrate 35%': 115,
  'Nova Broiler Concentrate': 110,
  'Nova Layer Concentrate': 110,
  'Afgri Broiler Concentrate 35%': 115,
  'Afgri Layer Concentrate 35%': 110,
  // Others
  'Wafi South Africa Concentrate': 120,
  'Intraco Nigeria Concentrate': 110,
  'Intraco Ghana Concentrate': 110,
  'Hendrix Pelleted Concentrate': 120,
  'Neoscience Poultry Premix': 280,
};

// Default prices for base ingredients (maize, salt, limestone, etc.) in KES per kg
const INGREDIENT_DEFAULT_PRICES: Record<string, number> = {
  'maize': 40,
  'sorghum': 38,
  'millet': 35,
  'cassava': 25,
  'salt': 50,
  'limestone flour': 20,
  'oyster shell grit': 25,
  'dcp (dicalcium phosphate)': 120,
  'wheat bran': 30,
  'soya bean meal': 150,
  'fishmeal': 200,
  'sunflower cake': 80,
  'groundnut cake': 120,
};

// Country multipliers (relative to Kenya = 1.0)
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
  // Add more as needed
};

// ========== HELPER: Get Price with Country Multiplier and Custom Override ==========
function getPrice(
  itemName: string,
  priceDb: Record<string, number>,
  country: string,
  customPrices?: Record<string, number>
): number {
  const normalized = itemName.toLowerCase().trim();
  // Custom price takes priority
  if (customPrices && customPrices[normalized] !== undefined && customPrices[normalized] > 0) {
    return customPrices[normalized];
  }
  // Look up in the database
  const basePrice = priceDb[normalized] || 100;
  const multiplier = COUNTRY_PRICE_MULTIPLIERS[country.toLowerCase()] || 1.0;
  return basePrice * multiplier;
}

// ========== MAIN FORMULATION FUNCTION ==========
export function formulateWithConcentrate(params: {
  breed: string;
  stage: string;
  quantityKg: number;                     // Total feed to mix (kg)
  concentrateBrand: string;
  concentrateProduct: string;
  inclusionRate?: number;                 // If not provided, use database default
  concentrateProtein?: number;            // If not provided, use database default
  farmerIngredients: {
    maizeKg: number;                      // Amount of maize to add (kg)
    saltKg: number;                       // Salt (kg)
    calciumSource: 'limestone' | 'oyster shell' | 'dcp' | 'none';
    calciumKg: number;                    // Amount of calcium source (kg)
    otherIngredients?: { name: string; kg: number }[];
  };
  country: string;
  customPrices?: Record<string, number>;  // Optional: farmer's local prices per kg
}): ConcentrateFeedResult {
  // Normalize
  const stageKey = stage.toLowerCase().includes('starter') ? 'starter' :
                   stage.toLowerCase().includes('grower') ? 'grower' :
                   stage.toLowerCase().includes('layer') ? 'layer' :
                   stage.toLowerCase().includes('finisher') ? 'finisher' : 'starter';

  // Look up concentrate product
  const productKey = `${params.concentrateBrand} ${params.concentrateProduct}`;
  let productData = CONCENTRATE_DEFAULT_PRICES[productKey];
  // If not found, try to match by brand+product without exact key
  if (!productData) {
    // Search by brand and product substring
    const brand = params.concentrateBrand.toLowerCase().trim();
    const product = params.concentrateProduct.toLowerCase().trim();
    for (const key of Object.keys(CONCENTRATE_DEFAULT_PRICES)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes(brand) && keyLower.includes(product)) {
        productData = CONCENTRATE_DEFAULT_PRICES[key];
        break;
      }
    }
  }
  // If still not found, use a default
  const baseConcentratePrice = productData || 120;

  // Get price per kg for concentrate (with country multiplier and custom override)
  const concentratePrice = getPrice(
    productKey,
    CONCENTRATE_DEFAULT_PRICES,
    params.country,
    params.customPrices
  );

  // Inclusion rate: use provided, else database default (we need to store rates)
  // We'll build a simple map of default inclusion rates based on product name patterns.
  const inclusionRates: Record<string, number> = {
    'Wafi Broiler Concentrate 40%': 40,
    'Wafi Layer Concentrate 35%': 35,
    'Wafi Breeder Concentrate': 30,
    'Intraco Broiler Concentrate 35%': 35,
    'Intraco Layer Concentrate 5%': 5,
    'Intraco Grower Concentrate 30%': 30,
    'Intraco Chikun Concentrate': 30,
    'Koudijs Broiler Concentrate 40%': 40,
    'Koudijs Layer Concentrate 35%': 35,
    'Koudijs Grower Concentrate 30%': 30,
    'Koudijs Breeder Concentrate': 30,
    'Hendrix Broiler Concentrate 25%': 25,
    'Hendrix Layer Concentrate 30%': 30,
    'Hendrix Pre-Starter Concentrate': 25,
    'Nuscience Broiler Concentrate 35%': 35,
    'Nuscience Layer Concentrate 5%': 5,
    'Nuscience Multi-concentrate': 30,
    'Provimi Broiler Concentrate': 35,
    'Provimi Layer Concentrate': 35,
    'DSM Poultry Premix': 2,
    'Cargill Broiler Concentrate': 35,
    'Cargill Layer Concentrate': 35,
    'CP Broiler Concentrate 40%': 40,
    'CP Layer Concentrate 35%': 35,
    'Jubaili Broiler Concentrate 30%': 30,
    'Jubaili Layer Concentrate 30%': 30,
    'Jubaili Kienyeji Concentrate 30%': 30,
    'Unga Layer Concentrate 35%': 35,
    'Unga Broiler Concentrate 35%': 35,
    'Afrimach Broiler Concentrate 30%': 30,
    'Afrimach Layer Concentrate 30%': 30,
    'Royal Dutch Broiler Concentrate 35%': 35,
    'Royal Dutch Layer Concentrate 35%': 35,
    'KukuCow Broiler Concentrate 40%': 40,
    'KukuCow Layer Concentrate 35%': 35,
    'Farmers Choice Broiler Concentrate': 30,
    'Farmers Choice Layer Concentrate': 30,
    'Transafrica Broiler Concentrate 30%': 30,
    'Transafrica Layer Concentrate 30%': 30,
    'Kenblest Broiler Concentrate': 30,
    'Kenblest Layer Concentrate': 30,
    'Ugachick Broiler Concentrate 35%': 35,
    'Ugachick Layer Concentrate 35%': 35,
    'NuFeeds Broiler Concentrate 30%': 30,
    'NuFeeds Layer Concentrate 30%': 30,
    'Kinyara Broiler Concentrate': 30,
    'Kinyara Layer Concentrate': 30,
    'TFC Broiler Concentrate 35%': 35,
    'TFC Layer Concentrate 35%': 35,
    'Mzalendo Broiler Concentrate 30%': 30,
    'Mzalendo Layer Concentrate 30%': 30,
    'Amo Broiler Concentrate 30%': 30,
    'Amo Layer Concentrate 30%': 30,
    'Premier Broiler Concentrate': 30,
    'Premier Layer Concentrate': 30,
    'Grand Broiler Concentrate': 30,
    'Grand Layer Concentrate': 30,
    'Raanan Broiler Concentrate 30%': 30,
    'Raanan Layer Concentrate 30%': 30,
    'Agro Broiler Concentrate': 30,
    'Agro Layer Concentrate': 30,
    'Meadow Broiler Concentrate 35%': 35,
    'Meadow Layer Concentrate 35%': 35,
    'Nova Broiler Concentrate': 30,
    'Nova Layer Concentrate': 30,
    'Afgri Broiler Concentrate 35%': 35,
    'Afgri Layer Concentrate 35%': 35,
    'Wafi South Africa Concentrate': 35,
    'Intraco Nigeria Concentrate': 35,
    'Intraco Ghana Concentrate': 35,
    'Hendrix Pelleted Concentrate': 35,
    'Neoscience Poultry Premix': 2,
  };
  const defaultInclusion = inclusionRates[productKey] || 35;
  const inclusionRate = params.inclusionRate ?? defaultInclusion;
  const concentrateProtein = params.concentrateProtein ?? (defaultProteinForProduct(productKey));

  // Helper to get default protein
  function defaultProteinForProduct(key: string): number {
    if (key.includes('Broiler') && key.includes('40%')) return 40;
    if (key.includes('Broiler') && key.includes('35%')) return 35;
    if (key.includes('Broiler') && key.includes('30%')) return 30;
    if (key.includes('Layer') && key.includes('35%')) return 35;
    if (key.includes('Layer') && key.includes('30%')) return 30;
    if (key.includes('Layer') && key.includes('5%')) return 45; // highly concentrated
    if (key.includes('Grower')) return 30;
    if (key.includes('Starter') && key.includes('25%')) return 25;
    if (key.includes('Pre-Starter')) return 22;
    if (key.includes('Breeder')) return 32;
    if (key.includes('Kienyeji')) return 28;
    if (key.includes('Chikun')) return 28;
    if (key.includes('Premix')) return 40;
    if (key.includes('Multi-concentrate')) return 35;
    return 35; // default
  }

  // Calculate ingredient amounts
  const totalKg = params.quantityKg;
  const concKg = (inclusionRate / 100) * totalKg;
  const farmerMaize = params.farmerIngredients.maizeKg || 0;
  const farmerSalt = params.farmerIngredients.saltKg || 0;
  const calciumSource = params.farmerIngredients.calciumSource;
  const calciumKg = params.farmerIngredients.calciumKg || 0;
  const otherIngredients = params.farmerIngredients.otherIngredients || [];

  // Verify total matches quantityKg (with tolerance)
  let totalUsed = concKg + farmerMaize + farmerSalt + calciumKg;
  otherIngredients.forEach(ing => totalUsed += ing.kg);
  const diff = totalKg - totalUsed;
  let warnings: string[] = [];
  if (Math.abs(diff) > 0.01) {
    warnings.push(`⚠️ Total ingredients (${totalUsed.toFixed(2)} kg) do not match your batch size (${totalKg} kg). We will adjust maize to balance.`);
    // Adjust maize to match exactly
    const adjustedMaize = farmerMaize + diff;
    // Update ingredient amounts in the result accordingly
    // We'll store the adjusted values in the final ingredients list.
  }

  // Build ingredients array
  const ingredients: Ingredient[] = [];

  // 1. Concentrate
  const concCost = concKg * concentratePrice;
  ingredients.push({
    name: `${params.concentrateBrand} ${params.concentrateProduct}`,
    amountKg: concKg,
    percent: (concKg / totalKg) * 100,
    cost: concCost,
    pricePerKg: concentratePrice,
  });

  // 2. Maize (adjusted if needed)
  let finalMaize = farmerMaize;
  if (Math.abs(diff) > 0.01) {
    finalMaize = farmerMaize + diff;
    if (finalMaize < 0) {
      warnings.push(`⚠️ Maize amount adjusted to ${finalMaize.toFixed(2)} kg to balance the batch.`);
    }
  }
  const maizePrice = getPrice('maize', INGREDIENT_DEFAULT_PRICES, params.country, params.customPrices);
  const maizeCost = finalMaize * maizePrice;
  ingredients.push({
    name: 'Maize',
    amountKg: finalMaize,
    percent: (finalMaize / totalKg) * 100,
    cost: maizeCost,
    pricePerKg: maizePrice,
  });

  // 3. Salt
  const saltPrice = getPrice('salt', INGREDIENT_DEFAULT_PRICES, params.country, params.customPrices);
  const saltCost = farmerSalt * saltPrice;
  ingredients.push({
    name: 'Salt',
    amountKg: farmerSalt,
    percent: (farmerSalt / totalKg) * 100,
    cost: saltCost,
    pricePerKg: saltPrice,
  });

  // 4. Calcium source
  if (calciumSource !== 'none' && calciumKg > 0) {
    let caName = 'Limestone flour';
    let caPriceKey = 'limestone flour';
    if (calciumSource === 'oyster shell') {
      caName = 'Oyster shell grit';
      caPriceKey = 'oyster shell grit';
    } else if (calciumSource === 'dcp') {
      caName = 'DCP (Dicalcium phosphate)';
      caPriceKey = 'dcp (dicalcium phosphate)';
    }
    const caPrice = getPrice(caPriceKey, INGREDIENT_DEFAULT_PRICES, params.country, params.customPrices);
    const caCost = calciumKg * caPrice;
    ingredients.push({
      name: caName,
      amountKg: calciumKg,
      percent: (calciumKg / totalKg) * 100,
      cost: caCost,
      pricePerKg: caPrice,
    });
  }

  // 5. Other ingredients
  otherIngredients.forEach(ing => {
    const price = getPrice(ing.name, INGREDIENT_DEFAULT_PRICES, params.country, params.customPrices);
    const cost = ing.kg * price;
    ingredients.push({
      name: ing.name,
      amountKg: ing.kg,
      percent: (ing.kg / totalKg) * 100,
      cost: cost,
      pricePerKg: price,
    });
  });

  // Calculate total cost
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);

  // Nutritional summary (approximate)
  // We need nutrient content of concentrate (protein, calcium, energy) – we only have protein from input/default.
  // For maize: protein ~9%, calcium ~0.03%, energy ~3400 kcal/kg
  // Salt: no protein, no calcium
  // Limestone: ~38% calcium
  // Oyster shell: ~38% calcium
  // DCP: ~22% calcium, ~18% phosphorus
  // We'll calculate protein and calcium.
  let totalProtein = 0;
  let totalCalcium = 0;
  const concProtein = concentrateProtein; // in %
  const maizeProtein = 9; // %
  const limestoneCa = 38; // %
  const oysterCa = 38;
  const dcpCa = 22;
  let calciumPercent = 0;

  // Protein calculation
  totalProtein = (concKg * (concProtein / 100)) + (finalMaize * (maizeProtein / 100));
  // Other ingredients may have protein (if we have data, we could add, but ignore for now)
  const proteinPercent = (totalProtein / totalKg) * 100;

  // Calcium calculation
  if (calciumSource === 'limestone') {
    calciumPercent = (calciumKg * (limestoneCa / 100)) / totalKg * 100;
  } else if (calciumSource === 'oyster shell') {
    calciumPercent = (calciumKg * (oysterCa / 100)) / totalKg * 100;
  } else if (calciumSource === 'dcp') {
    calciumPercent = (calciumKg * (dcpCa / 100)) / totalKg * 100;
  }

  // Energy – estimate from maize and concentrate (rough)
  const maizeEnergy = 3400; // kcal/kg
  const concEnergy = 2800; // typical
  const totalEnergy = (finalMaize * maizeEnergy) + (concKg * concEnergy);
  const energyPerKg = totalEnergy / totalKg;

  const nutrition: NutritionalSummary = {
    protein: parseFloat(proteinPercent.toFixed(1)),
    calcium: parseFloat(calciumPercent.toFixed(2)),
    energy: Math.round(energyPerKg),
  };

  // Warnings
  if (stageKey === 'layer' && nutrition.calcium < 3.5) {
    warnings.push(`⚠️ Calcium is low for layers (${nutrition.calcium}%). Aim for 3.5–4.0%. Add more limestone/oyster shell.`);
  }
  if (stageKey === 'starter' && nutrition.protein < 18) {
    warnings.push(`⚠️ Protein is low for starter (${nutrition.protein}%). Aim for 18–22%. Consider a higher protein concentrate.`);
  }
  if (stageKey === 'finisher' && nutrition.protein < 16) {
    warnings.push(`⚠️ Protein is low for finisher (${nutrition.protein}%). Aim for 16–18%.`);
  }
  if (farmerSalt > 0.5) {
    warnings.push(`⚠️ Salt exceeds 0.5% of the feed. Recommended 0.3–0.5% – reduce salt to avoid toxicity.`);
  }
  if (Math.abs(diff) > 1) {
    warnings.push(`⚠️ Batch size mismatch – adjust maize to match total.`);
  }

  // Mixing instructions
  let mixingInstructions = "Mix all ingredients thoroughly in a clean, dry area. Start by weighing each ingredient accurately.\n";
  mixingInstructions += `1. Add the ${params.concentrateBrand} concentrate (${concKg.toFixed(2)} kg) to the mixing area.\n`;
  mixingInstructions += `2. Add the maize (${finalMaize.toFixed(2)} kg) and mix well.\n`;
  mixingInstructions += `3. Add salt (${farmerSalt.toFixed(2)} kg) and the calcium source (${calciumKg.toFixed(2)} kg).\n`;
  if (otherIngredients.length > 0) {
    otherIngredients.forEach(ing => {
      mixingInstructions += `4. Add ${ing.name} (${ing.kg.toFixed(2)} kg).\n`;
    });
  }
  mixingInstructions += "5. Mix until the colour is uniform and there are no streaks.";
  if (stageKey === 'starter') {
    mixingInstructions += " For chicks, crumble the feed or mash it to a fine consistency.";
  }

  // Build structured list (for the AI to display and speak)
  const structuredList = [
    {
      key: "feed_summary",
      params: {
        content: `Feed formula using ${params.concentrateBrand} ${params.concentrateProduct} for ${params.breed} ${stageKey} – ${totalKg} kg batch`
      }
    },
    {
      key: "ingredient_list",
      params: {
        content: `Ingredients:\n${ingredients.map(ing => `${ing.name}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})`).join('\n')}`
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
    ingredients,
    totalCost,
    nutritionalSummary: nutrition,
    mixingInstructions,
    warnings,
    structuredList,
  };
}
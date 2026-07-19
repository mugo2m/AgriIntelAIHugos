// lib/dairyFeedFormulation.ts
// COMPLETE DAIRY FEED FORMULATION ENGINE (TMR – Total Mixed Ration)
// This module calculates a balanced, cost-effective dairy ration using locally available ingredients.
// It follows NRC (2001) recommendations and adjusts for cow category, body weight, milk yield,
// and available forages, grains, protein sources, minerals, and additives.
// All costs are in the base currency of the selected country and can be overridden by custom farmer prices.

export interface DairyIngredient {
  name: string;
  amountKg: number;          // kg per cow per day (as fed)
  percentDM: number;         // percentage of total dry matter
  cost: number;              // total cost per day
  pricePerKg: number;        // cost per kg (as fed)
  available?: boolean;       // true if farmer has it
  isSubstitute?: boolean;
  originalName?: string;
}

export interface DairyNutritionalSummary {
  dryMatterKg: number;       // total DMI per day (kg)
  cpPercent: number;         // crude protein % of DM
  meMcal: number;           // metabolisable energy (Mcal/kg DM)
  ndfPercent: number;       // neutral detergent fibre % of DM
  calciumPercent: number;   // calcium % of DM
  phosphorusPercent: number; // phosphorus % of DM
  saltPercent: number;      // salt % of DM (approx)
}

export interface DairyFeedResult {
  ingredients: DairyIngredient[];
  totalCostPerDay: number;   // total feed cost per cow per day
  nutritionalSummary: DairyNutritionalSummary;
  mixingInstructions: string;
  warnings: string[];
  structuredList: Array<{ key: string; params: { content: string } }>;
  substitutionsMade?: string[];
}

// ========== INGREDIENT COMPOSITION DATABASE (as fed basis, ~90% DM unless noted) ==========
interface IngredientNutrients {
  cp: number;      // crude protein %
  me: number;      // metabolisable energy (Mcal/kg DM)
  ndf: number;     // neutral detergent fibre %
  ca: number;      // calcium %
  p: number;       // phosphorus %
  salt: number;    // sodium chloride % (if any)
  dm: number;      // dry matter % (e.g., 0.9 for dry, 0.25 for fresh forages)
}

const INGREDIENT_DB: Record<string, IngredientNutrients> = {
  // Forages (fresh / as fed)
  'napier grass': { cp: 8, me: 2.0, ndf: 65, ca: 0.4, p: 0.2, salt: 0, dm: 0.25 },
  'rhodes hay': { cp: 7, me: 1.9, ndf: 68, ca: 0.3, p: 0.2, salt: 0, dm: 0.88 },
  'lucerne hay': { cp: 18, me: 2.2, ndf: 45, ca: 1.2, p: 0.25, salt: 0, dm: 0.9 },
  'maize silage': { cp: 8, me: 2.5, ndf: 45, ca: 0.2, p: 0.2, salt: 0, dm: 0.35 },
  'oat hay': { cp: 9, me: 2.0, ndf: 60, ca: 0.3, p: 0.2, salt: 0, dm: 0.88 },
  'desmodium (fresh)': { cp: 22, me: 2.1, ndf: 40, ca: 0.8, p: 0.3, salt: 0, dm: 0.25 },
  'banana leaves': { cp: 6, me: 1.8, ndf: 70, ca: 0.5, p: 0.15, salt: 0, dm: 0.25 },
  'maize stover': { cp: 4, me: 1.5, ndf: 75, ca: 0.3, p: 0.1, salt: 0, dm: 0.9 },
  'wheat straw': { cp: 3, me: 1.3, ndf: 80, ca: 0.2, p: 0.1, salt: 0, dm: 0.9 },

  // Energy sources (dry)
  'maize': { cp: 9, me: 3.4, ndf: 9, ca: 0.03, p: 0.3, salt: 0, dm: 0.9 },
  'sorghum': { cp: 10, me: 3.3, ndf: 10, ca: 0.04, p: 0.3, salt: 0, dm: 0.9 },
  'millet': { cp: 11, me: 3.2, ndf: 12, ca: 0.04, p: 0.3, salt: 0, dm: 0.9 },
  'wheat bran': { cp: 16, me: 2.6, ndf: 40, ca: 0.1, p: 0.8, salt: 0, dm: 0.88 },
  'pollard': { cp: 14, me: 2.8, ndf: 35, ca: 0.1, p: 0.7, salt: 0, dm: 0.88 },
  'rice bran': { cp: 12, me: 2.7, ndf: 35, ca: 0.05, p: 0.6, salt: 0, dm: 0.9 },
  'maize germ meal': { cp: 18, me: 2.8, ndf: 30, ca: 0.05, p: 0.5, salt: 0, dm: 0.9 },
  'cassava root (dried)': { cp: 2, me: 3.5, ndf: 5, ca: 0.1, p: 0.1, salt: 0, dm: 0.88 },
  'molasses': { cp: 3, me: 2.8, ndf: 0, ca: 0.8, p: 0.1, salt: 0, dm: 0.75 },
  'sweet potatoes (dried)': { cp: 4, me: 3.2, ndf: 8, ca: 0.1, p: 0.15, salt: 0, dm: 0.85 },

  // Protein sources (dry)
  'soybean meal': { cp: 46, me: 3.0, ndf: 15, ca: 0.3, p: 0.6, salt: 0, dm: 0.88 },
  'sunflower cake (low fat)': { cp: 30, me: 2.5, ndf: 35, ca: 0.4, p: 0.7, salt: 0, dm: 0.88 },
  'cottonseed cake': { cp: 22, me: 2.3, ndf: 30, ca: 0.2, p: 0.6, salt: 0, dm: 0.88 },
  'groundnut cake': { cp: 42, me: 2.8, ndf: 12, ca: 0.2, p: 0.5, salt: 0, dm: 0.88 },
  'canola meal': { cp: 36, me: 2.7, ndf: 25, ca: 0.6, p: 0.8, salt: 0, dm: 0.88 },
  'linseed cake': { cp: 34, me: 2.8, ndf: 20, ca: 0.3, p: 0.7, salt: 0, dm: 0.88 },
  'fishmeal': { cp: 62, me: 2.9, ndf: 0, ca: 4.0, p: 2.5, salt: 0, dm: 0.92 },
  'meat and bone meal': { cp: 50, me: 2.6, ndf: 0, ca: 8.0, p: 4.0, salt: 0, dm: 0.9 },
  'brewers grains (wet)': { cp: 25, me: 2.4, ndf: 45, ca: 0.2, p: 0.3, salt: 0, dm: 0.25 },
  'lucerne hay (protein)': { cp: 18, me: 2.2, ndf: 45, ca: 1.2, p: 0.25, salt: 0, dm: 0.9 },

  // Minerals & additives
  'salt': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 100, dm: 0.95 },
  'limestone flour': { cp: 0, me: 0, ndf: 0, ca: 38, p: 0, salt: 0, dm: 0.95 },
  'oyster shell grit': { cp: 0, me: 0, ndf: 0, ca: 38, p: 0, salt: 0, dm: 0.95 },
  'dcp': { cp: 0, me: 0, ndf: 0, ca: 22, p: 18, salt: 0, dm: 0.95 },
  'magnesium oxide': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 0, dm: 0.95 },
  'dairy premix': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 0, dm: 0.95 },
  'sodium bicarbonate': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 0, dm: 0.95 },
  'yeast culture': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 0, dm: 0.9 },
  'toxin binder': { cp: 0, me: 0, ndf: 0, ca: 0, p: 0, salt: 0, dm: 0.9 },
};

// ========== DEFAULT PRICES (KES per kg as fed) ==========
const DEFAULT_PRICES: Record<string, number> = {
  'napier grass': 5,
  'rhodes hay': 30,
  'lucerne hay': 45,
  'maize silage': 20,
  'oat hay': 35,
  'desmodium': 10,
  'banana leaves': 3,
  'maize stover': 5,
  'wheat straw': 8,
  'maize': 40,
  'sorghum': 38,
  'millet': 35,
  'wheat bran': 30,
  'pollard': 32,
  'rice bran': 28,
  'maize germ meal': 25,
  'cassava root (dried)': 25,
  'molasses': 25,
  'sweet potatoes (dried)': 30,
  'soybean meal': 150,
  'sunflower cake (low fat)': 80,
  'cottonseed cake': 70,
  'groundnut cake': 120,
  'canola meal': 90,
  'linseed cake': 100,
  'fishmeal': 200,
  'meat and bone meal': 110,
  'brewers grains (wet)': 15,
  'lucerne hay (protein)': 45,
  'salt': 50,
  'limestone flour': 20,
  'oyster shell grit': 25,
  'dcp': 120,
  'magnesium oxide': 100,
  'dairy premix': 300,
  'sodium bicarbonate': 80,
  'yeast culture': 200,
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
const SUBSTITUTIONS: Record<string, { substitute: string; factor: number }[]> = {
  'maize': [
    { substitute: 'sorghum', factor: 0.95 },
    { substitute: 'millet', factor: 0.9 },
    { substitute: 'cassava root (dried)', factor: 1.2 },
  ],
  'soybean meal': [
    { substitute: 'sunflower cake (low fat)', factor: 1.3 },
    { substitute: 'cottonseed cake', factor: 1.2 },
    { substitute: 'groundnut cake', factor: 0.9 },
    { substitute: 'canola meal', factor: 1.2 },
  ],
  'fishmeal': [
    { substitute: 'meat and bone meal', factor: 1.1 },
    { substitute: 'soybean meal', factor: 1.3 },
  ],
  'lucerne hay': [
    { substitute: 'desmodium', factor: 0.9 },
    { substitute: 'oat hay', factor: 1.2 },
  ],
  'napier grass': [
    { substitute: 'banana leaves', factor: 1.1 },
    { substitute: 'maize stover', factor: 1.2 },
  ],
};

// ========== NUTRIENT TARGETS (per kg DM) ==========
interface NutrientTarget {
  cp: number;      // crude protein %
  me: number;      // Mcal/kg DM
  ndf: number;     // neutral detergent fibre %
  ca: number;      // calcium %
  p: number;       // phosphorus %
  salt: number;    // salt %
}

const TARGETS: Record<string, NutrientTarget> = {
  'lactating_high': { cp: 19, me: 2.9, ndf: 25, ca: 0.9, p: 0.5, salt: 0.4 }, // >25L milk
  'lactating_med':  { cp: 17, me: 2.7, ndf: 27, ca: 0.8, p: 0.45, salt: 0.4 }, // 15-25L
  'lactating_low':  { cp: 15, me: 2.5, ndf: 28, ca: 0.7, p: 0.4, salt: 0.4 }, // <15L
  'dry_cow':        { cp: 12, me: 2.4, ndf: 32, ca: 0.6, p: 0.35, salt: 0.3 },
  'heifer':         { cp: 14, me: 2.5, ndf: 30, ca: 0.6, p: 0.4, salt: 0.3 },
  'calf_starter':   { cp: 20, me: 3.0, ndf: 20, ca: 0.7, p: 0.5, salt: 0.3 },
};

// ========== HELPERS ==========
function getPrice(
  ingredient: string,
  country: string,
  customPrices?: Record<string, number>
): number {
  const key = ingredient.toLowerCase().trim();
  if (customPrices && customPrices[key] !== undefined && customPrices[key] > 0) {
    return customPrices[key];
  }
  const base = DEFAULT_PRICES[key] || 50;
  const multiplier = COUNTRY_PRICE_MULTIPLIERS[country.toLowerCase()] || 1.0;
  return base * multiplier;
}

// ========== SUBSTITUTION ENGINE ==========
function applySubstitutions(
  available: string[],
  needed: string[]
): { ingredients: string[]; substitutionsMade: string[] } {
  const result: string[] = [];
  const substitutionsMade: string[] = [];
  const availSet = new Set(available.map(i => i.toLowerCase().trim()));

  for (const ing of needed) {
    const ingKey = ing.toLowerCase().trim();
    if (availSet.has(ingKey)) {
      result.push(ing);
      continue;
    }
    const subChain = SUBSTITUTIONS[ingKey];
    if (subChain) {
      let found = false;
      for (const sub of subChain) {
        if (availSet.has(sub.substitute.toLowerCase().trim())) {
          result.push(sub.substitute);
          substitutionsMade.push(`${ing} → ${sub.substitute}`);
          found = true;
          break;
        }
      }
      if (!found) {
        // If no substitute available, keep original but will cause warning
        result.push(ing);
      }
    } else {
      result.push(ing);
    }
  }
  return { ingredients: result, substitutionsMade };
}

// ========== MAIN ENGINE ==========
export function formulateDairyFeed(params: {
  cowCategory: 'lactating' | 'dry' | 'heifer' | 'calf';
  bodyWeightKg: number;
  milkYieldL?: number;          // for lactating cows (litres/day)
  milkFatPercent?: number;      // optional, default 4.0
  availableForages: string[];
  availableGrains: string[];
  availableProteinSources: string[];
  availableMinerals: string[];
  quantityKgPerCowPerDay?: number; // optional, engine will calculate DMI if not given
  country: string;
  customPrices?: Record<string, number>;
}): DairyFeedResult {
  // Normalize
  const category = params.cowCategory;
  const bw = params.bodyWeightKg;
  const milkYield = params.milkYieldL || 0;
  const milkFat = params.milkFatPercent || 4.0;
  const country = params.country;
  const customPrices = params.customPrices || {};

  // Determine target based on category and milk yield
  let targetKey = 'dry_cow';
  if (category === 'lactating') {
    if (milkYield > 25) targetKey = 'lactating_high';
    else if (milkYield >= 15) targetKey = 'lactating_med';
    else targetKey = 'lactating_low';
  } else if (category === 'heifer') {
    targetKey = 'heifer';
  } else if (category === 'calf') {
    targetKey = 'calf_starter';
  } else {
    targetKey = 'dry_cow';
  }
  const target = TARGETS[targetKey];

  // Calculate dry matter intake (DMI) in kg/day
  let dmi = 0;
  if (params.quantityKgPerCowPerDay && params.quantityKgPerCowPerDay > 0) {
    dmi = params.quantityKgPerCowPerDay; // farmer specified total as-fed quantity
  } else {
    // Estimate DMI from body weight and milk yield
    if (category === 'lactating') {
      // DMI = 0.02 × BW + 0.3 × (FCM / 100) (simplified)
      const fcm = milkYield * (0.4 + 0.15 * (milkFat / 3.5)); // fat-corrected milk
      dmi = 0.02 * bw + 0.3 * (fcm / 100);
      // Ensure minimum 2.5% of BW
      if (dmi < 0.025 * bw) dmi = 0.025 * bw;
    } else if (category === 'dry') {
      dmi = 0.02 * bw;
    } else if (category === 'heifer') {
      dmi = 0.025 * bw;
    } else { // calf
      dmi = 0.03 * bw;
    }
  }
  // Ensure DMI > 0
  if (dmi < 0.1) dmi = 0.1;

  // Build a list of all selected ingredients (as-fed)
  const selectedAsFed: string[] = [];
  const availableSets: { [key: string]: string[] } = {
    forage: params.availableForages,
    grain: params.availableGrains,
    protein: params.availableProteinSources,
    mineral: params.availableMinerals,
  };

  // Combine all selected ingredient names
  const allSelected = [
    ...params.availableForages,
    ...params.availableGrains,
    ...params.availableProteinSources,
    ...params.availableMinerals,
  ];

  // If no ingredients selected, add defaults (napier, maize, soya, salt, limestone)
  if (allSelected.length === 0) {
    allSelected.push('napier grass');
    allSelected.push('maize');
    allSelected.push('soybean meal');
    allSelected.push('salt');
    allSelected.push('limestone flour');
  }

  // Apply substitutions: we need to ensure we have at least one forage, one grain, one protein, and minerals
  // We'll use the substitution logic to replace missing critical ingredients.
  // For simplicity, we'll assume the farmer has selected at least one forage, one grain, one protein, and salt+calcium.
  // If not, we'll add defaults.
  const neededIngredients = [...allSelected];
  // Ensure at least one forage
  const hasForage = neededIngredients.some(i => params.availableForages.includes(i));
  if (!hasForage) neededIngredients.push('napier grass');
  // Ensure at least one grain
  const hasGrain = neededIngredients.some(i => params.availableGrains.includes(i));
  if (!hasGrain) neededIngredients.push('maize');
  // Ensure at least one protein
  const hasProtein = neededIngredients.some(i => params.availableProteinSources.includes(i));
  if (!hasProtein) neededIngredients.push('soybean meal');
  // Ensure salt and limestone
  if (!neededIngredients.some(i => i === 'salt')) neededIngredients.push('salt');
  if (!neededIngredients.some(i => i === 'limestone flour' || i === 'dcp' || i === 'oyster shell grit')) {
    neededIngredients.push('limestone flour');
  }

  // Apply substitution engine
  const { ingredients: finalIngredientNames, substitutionsMade } = applySubstitutions(
    allSelected,
    neededIngredients
  );

  // Now we have a list of ingredient names to use. We'll balance the ration using a simple algorithm:
  // 1. Fix forage amount to meet NDF target (minimum 25% NDF in DM)
  // 2. Add grains to meet energy target
  // 3. Add protein sources to meet CP target
  // 4. Add minerals to meet Ca, P, and salt targets
  // 5. Adjust to exactly fill DMI

  // We'll group ingredients by type
  const forageNames = finalIngredientNames.filter(i => params.availableForages.includes(i) || i.includes('napier') || i.includes('hay') || i.includes('silage') || i.includes('stover') || i.includes('straw') || i.includes('leaves') || i.includes('desmodium'));
  const grainNames = finalIngredientNames.filter(i => params.availableGrains.includes(i) || i === 'maize' || i === 'sorghum' || i === 'millet' || i === 'wheat bran' || i === 'pollard' || i === 'rice bran' || i === 'maize germ meal' || i === 'cassava' || i === 'molasses' || i === 'sweet potatoes');
  const proteinNames = finalIngredientNames.filter(i => params.availableProteinSources.includes(i) || i === 'soybean meal' || i === 'sunflower cake' || i === 'cottonseed cake' || i === 'groundnut cake' || i === 'canola meal' || i === 'linseed cake' || i === 'fishmeal' || i === 'meat and bone meal' || i === 'brewers grains' || i === 'lucerne hay' || i === 'desmodium');
  const mineralNames = finalIngredientNames.filter(i => params.availableMinerals.includes(i) || i === 'salt' || i === 'limestone flour' || i === 'oyster shell grit' || i === 'dcp' || i === 'magnesium oxide' || i === 'dairy premix' || i === 'sodium bicarbonate' || i === 'yeast culture' || i === 'toxin binder');

  // Ensure we have at least one forage
  let forageIngredient = forageNames.length > 0 ? forageNames[0] : 'napier grass';
  let grainIngredient = grainNames.length > 0 ? grainNames[0] : 'maize';
  let proteinIngredient = proteinNames.length > 0 ? proteinNames[0] : 'soybean meal';

  // Get nutrient values for the chosen ingredients
  function getNutrients(name: string): IngredientNutrients {
    const key = name.toLowerCase().trim();
    return INGREDIENT_DB[key] || { cp: 10, me: 2.5, ndf: 30, ca: 0.1, p: 0.3, salt: 0, dm: 0.85 };
  }

  // We'll solve for amounts of forage, grain, protein, and minerals to meet targets.
  // Let's use a simple iterative approach: start with forage at max NDF, then add grains and protein.
  // We'll work on DM basis.

  let forageDM = 0;
  let grainDM = 0;
  let proteinDM = 0;
  let mineralDM = 0;

  // Estimate target NDF % of DM (from target)
  const targetNDF = target.ndf;

  // Forage DM: we want to achieve target NDF. Assume forage contributes most NDF.
  // Let's solve for forageDM such that (forageDM * forageNDF + grainDM*0 + proteinDM*0) / totalDM = targetNDF (approx)
  // We'll do a simple while loop to adjust.

  // We'll start with a guess: forageDM = 0.5 * dmi (50% of DMI from forage)
  forageDM = 0.5 * dmi;
  let remainingDM = dmi - forageDM;

  // Grain and protein will fill the rest. We'll split remaining between grain and protein to meet CP and ME.
  // We'll first allocate a portion to protein to meet CP, then the rest to grain to meet energy.
  // Then adjust minerals (they are small).

  // We'll iterate a few times to converge.

  for (let iter = 0; iter < 10; iter++) {
    // Calculate nutrients from current allocation
    const forageNut = getNutrients(forageIngredient);
    const grainNut = getNutrients(grainIngredient);
    const proteinNut = getNutrients(proteinIngredient);

    // Compute total CP, ME, NDF
    const totalDM = forageDM + grainDM + proteinDM + mineralDM;
    if (totalDM === 0) break;

    const totalCP = (forageDM * forageNut.cp + grainDM * grainNut.cp + proteinDM * proteinNut.cp) / 100;
    const totalME = (forageDM * forageNut.me + grainDM * grainNut.me + proteinDM * proteinNut.me);
    const totalNDF = (forageDM * forageNut.ndf + grainDM * grainNut.ndf + proteinDM * proteinNut.ndf) / 100;
    const cpPercent = (totalCP / totalDM) * 100;
    const meMcal = totalME / totalDM;
    const ndfPercent = (totalNDF / totalDM) * 100;

    // Adjustments
    let adjustForage = 0;
    let adjustGrain = 0;
    let adjustProtein = 0;
    let adjustMineral = 0;

    // 1. NDF: if ndfPercent < targetNDF, increase forage; if >, decrease forage
    const ndfDiff = targetNDF - ndfPercent;
    if (Math.abs(ndfDiff) > 0.5) {
      adjustForage = ndfDiff * 0.01 * dmi; // small step
    }

    // 2. CP: if cpPercent < target.cp, increase protein; if >, decrease protein
    const cpDiff = target.cp - cpPercent;
    if (Math.abs(cpDiff) > 0.2) {
      adjustProtein = cpDiff * 0.005 * dmi;
    }

    // 3. ME: if meMcal < target.me, increase grain; if >, decrease grain
    const meDiff = target.me - meMcal;
    if (Math.abs(meDiff) > 0.02) {
      adjustGrain = meDiff * 0.5 * dmi;
    }

    // Apply adjustments (keep amounts positive)
    forageDM = Math.max(0, forageDM + adjustForage);
    // Ensure forageDM at least 0.2 * dmi (minimum forage)
    if (forageDM < 0.2 * dmi) forageDM = 0.2 * dmi;
    // Ensure forageDM not > 0.8 * dmi
    if (forageDM > 0.8 * dmi) forageDM = 0.8 * dmi;

    proteinDM = Math.max(0, proteinDM + adjustProtein);
    grainDM = Math.max(0, grainDM + adjustGrain);

    // Recalculate remaining DM after forage, protein, and mineral
    // We'll keep minerals fixed small amount (0.1 kg DM)
    mineralDM = 0.1; // 100g minerals per day (salt, limestone, etc.)

    // Now fill the rest with grain to make total = dmi
    const currentTotal = forageDM + grainDM + proteinDM + mineralDM;
    if (currentTotal < dmi) {
      grainDM += (dmi - currentTotal);
    } else if (currentTotal > dmi) {
      // Reduce grain
      grainDM = Math.max(0, grainDM - (currentTotal - dmi));
    }

    // Ensure grainDM not negative
    if (grainDM < 0) grainDM = 0;
  }

  // Now convert DM to as-fed amounts
  const forageNut = getNutrients(forageIngredient);
  const grainNut = getNutrients(grainIngredient);
  const proteinNut = getNutrients(proteinIngredient);

  const forageAsFed = forageDM / forageNut.dm;
  const grainAsFed = grainDM / grainNut.dm;
  const proteinAsFed = proteinDM / proteinNut.dm;

  // Minerals: we'll add salt, calcium, etc. as separate ingredients.
  // We'll include a default mineral mix: salt 0.3% of DM, limestone to meet Ca, and DCP if needed.
  // For simplicity, we'll add small fixed amounts.
  const saltDM = 0.003 * dmi; // 0.3% salt
  const limestoneDM = 0.005 * dmi; // 0.5% limestone (to provide Ca)
  const dcpDM = 0.002 * dmi; // 0.2% DCP (to provide P)
  // Convert to as-fed
  const saltAsFed = saltDM / 0.95;
  const limestoneAsFed = limestoneDM / 0.95;
  const dcpAsFed = dcpDM / 0.95;

  // Build ingredient list (as-fed)
  const ingredientList: DairyIngredient[] = [];

  // Add forage
  const foragePrice = getPrice(forageIngredient, country, customPrices);
  ingredientList.push({
    name: forageIngredient,
    amountKg: parseFloat(forageAsFed.toFixed(3)),
    percentDM: parseFloat(((forageDM / dmi) * 100).toFixed(1)),
    cost: parseFloat((forageAsFed * foragePrice).toFixed(2)),
    pricePerKg: foragePrice,
    available: params.availableForages.includes(forageIngredient) || false,
  });

  // Add grain
  const grainPrice = getPrice(grainIngredient, country, customPrices);
  ingredientList.push({
    name: grainIngredient,
    amountKg: parseFloat(grainAsFed.toFixed(3)),
    percentDM: parseFloat(((grainDM / dmi) * 100).toFixed(1)),
    cost: parseFloat((grainAsFed * grainPrice).toFixed(2)),
    pricePerKg: grainPrice,
    available: params.availableGrains.includes(grainIngredient) || false,
  });

  // Add protein
  const proteinPrice = getPrice(proteinIngredient, country, customPrices);
  ingredientList.push({
    name: proteinIngredient,
    amountKg: parseFloat(proteinAsFed.toFixed(3)),
    percentDM: parseFloat(((proteinDM / dmi) * 100).toFixed(1)),
    cost: parseFloat((proteinAsFed * proteinPrice).toFixed(2)),
    pricePerKg: proteinPrice,
    available: params.availableProteinSources.includes(proteinIngredient) || false,
  });

  // Add minerals (salt, limestone, dcp)
  const saltPrice = getPrice('salt', country, customPrices);
  ingredientList.push({
    name: 'salt',
    amountKg: parseFloat(saltAsFed.toFixed(3)),
    percentDM: parseFloat(((saltDM / dmi) * 100).toFixed(1)),
    cost: parseFloat((saltAsFed * saltPrice).toFixed(2)),
    pricePerKg: saltPrice,
    available: params.availableMinerals.includes('salt') || false,
  });

  const limestonePrice = getPrice('limestone flour', country, customPrices);
  ingredientList.push({
    name: 'limestone flour',
    amountKg: parseFloat(limestoneAsFed.toFixed(3)),
    percentDM: parseFloat(((limestoneDM / dmi) * 100).toFixed(1)),
    cost: parseFloat((limestoneAsFed * limestonePrice).toFixed(2)),
    pricePerKg: limestonePrice,
    available: params.availableMinerals.includes('limestone flour') || false,
  });

  if (dcpAsFed > 0.001) {
    const dcpPrice = getPrice('dcp', country, customPrices);
    ingredientList.push({
      name: 'dcp',
      amountKg: parseFloat(dcpAsFed.toFixed(3)),
      percentDM: parseFloat(((dcpDM / dmi) * 100).toFixed(1)),
      cost: parseFloat((dcpAsFed * dcpPrice).toFixed(2)),
      pricePerKg: dcpPrice,
      available: params.availableMinerals.includes('dcp') || false,
    });
  }

  // Compute total cost
  const totalCost = ingredientList.reduce((sum, ing) => sum + ing.cost, 0);

  // Compute final nutritional summary (using the actual amounts)
  let actualDM = 0;
  let actualCP = 0;
  let actualME = 0;
  let actualNDF = 0;
  let actualCa = 0;
  let actualP = 0;
  let actualSalt = 0;

  ingredientList.forEach(ing => {
    const nut = getNutrients(ing.name);
    const dmKg = ing.amountKg * nut.dm;
    actualDM += dmKg;
    actualCP += dmKg * (nut.cp / 100);
    actualME += dmKg * nut.me;
    actualNDF += dmKg * (nut.ndf / 100);
    actualCa += dmKg * (nut.ca / 100);
    actualP += dmKg * (nut.p / 100);
    actualSalt += dmKg * (nut.salt / 100);
  });

  // If actualDM is zero, avoid division by zero
  if (actualDM === 0) actualDM = dmi;
  const cpFinal = (actualCP / actualDM) * 100;
  const meFinal = actualME / actualDM;
  const ndfFinal = (actualNDF / actualDM) * 100;
  const caFinal = (actualCa / actualDM) * 100;
  const pFinal = (actualP / actualDM) * 100;
  const saltFinal = (actualSalt / actualDM) * 100;

  const nutrition: DairyNutritionalSummary = {
    dryMatterKg: parseFloat(actualDM.toFixed(2)),
    cpPercent: parseFloat(cpFinal.toFixed(1)),
    meMcal: parseFloat(meFinal.toFixed(2)),
    ndfPercent: parseFloat(ndfFinal.toFixed(1)),
    calciumPercent: parseFloat(caFinal.toFixed(2)),
    phosphorusPercent: parseFloat(pFinal.toFixed(2)),
    saltPercent: parseFloat(saltFinal.toFixed(2)),
  };

  // Warnings
  const warnings: string[] = [];
  if (nutrition.cpPercent < target.cp - 1) {
    warnings.push(`⚠️ Protein is low (${nutrition.cpPercent}%). Target is ${target.cp}%. Increase protein source.`);
  }
  if (nutrition.cpPercent > target.cp + 2) {
    warnings.push(`⚠️ Protein is high (${nutrition.cpPercent}%). Consider reducing protein source to save cost.`);
  }
  if (nutrition.meMcal < target.me - 0.05) {
    warnings.push(`⚠️ Energy is low (${nutrition.meMcal} Mcal/kg). Target is ${target.me}. Increase grain/energy source.`);
  }
  if (nutrition.ndfPercent < target.ndf - 3) {
    warnings.push(`⚠️ Fibre (NDF) is low (${nutrition.ndfPercent}%). Target is ${target.ndf}%. Add more forage.`);
  }
  if (nutrition.ndfPercent > target.ndf + 5) {
    warnings.push(`⚠️ Fibre (NDF) is high (${nutrition.ndfPercent}%). Consider reducing forage and adding more concentrate.`);
  }
  if (nutrition.calciumPercent < target.ca - 0.1) {
    warnings.push(`⚠️ Calcium is low (${nutrition.calciumPercent}%). Add more limestone or oyster shell.`);
  }
  if (nutrition.phosphorusPercent < target.p - 0.05) {
    warnings.push(`⚠️ Phosphorus is low (${nutrition.phosphorusPercent}%). Add DCP.`);
  }
  if (nutrition.saltPercent > 0.6) {
    warnings.push(`⚠️ Salt is high (${nutrition.saltPercent}%). Reduce salt to <0.5%.`);
  }
  if (nutrition.saltPercent < 0.2) {
    warnings.push(`⚠️ Salt is low (${nutrition.saltPercent}%). Add salt to meet 0.3-0.5%.`);
  }

  // Check if we had substitutions
  if (substitutionsMade.length > 0) {
    warnings.push(`⚠️ Substitutions made: ${substitutionsMade.join('; ')}. Nutritional balance may differ.`);
  }

  // Mixing instructions
  let mixingInstructions = "Mix all ingredients thoroughly to make a Total Mixed Ration (TMR).\n";
  ingredientList.forEach(ing => {
    mixingInstructions += `- Add ${ing.amountKg.toFixed(2)} kg of ${ing.name}.\n`;
  });
  mixingInstructions += "Ensure forage is chopped to 2-3 cm length for good mixing and rumen function.";
  if (params.cowCategory === 'lactating') {
    mixingInstructions += " For lactating cows, feed this TMR twice daily (morning and evening).";
  } else {
    mixingInstructions += " For dry cows/heifers, feed once daily.";
  }

  // Structured list for display/voice
  const structuredList = [
    {
      key: "dairy_feed_summary",
      params: {
        content: `Feed ration for ${category} cow, ${bw} kg, milk ${milkYield} L/day`
      }
    },
    {
      key: "dairy_ingredient_list",
      params: {
        content: `Ingredients (kg/cow/day):\n${ingredientList.map(ing => `${ing.name}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})`).join('\n')}`
      }
    },
    {
      key: "dairy_nutritional_summary",
      params: {
        content: `Nutritional Summary: DMI ${nutrition.dryMatterKg} kg, CP ${nutrition.cpPercent}%, ME ${nutrition.meMcal} Mcal/kg, NDF ${nutrition.ndfPercent}%, Ca ${nutrition.calciumPercent}%, P ${nutrition.phosphorusPercent}%, Salt ${nutrition.saltPercent}%`
      }
    },
    {
      key: "dairy_total_cost",
      params: {
        content: `Total daily feed cost: ${totalCost.toFixed(2)}`
      }
    },
    {
      key: "dairy_mixing_instructions",
      params: {
        content: mixingInstructions
      }
    }
  ];

  if (warnings.length > 0) {
    structuredList.push({
      key: "dairy_warnings",
      params: {
        content: `Warnings:\n${warnings.join('\n')}`
      }
    });
  }

  return {
    ingredients: ingredientList,
    totalCostPerDay: totalCost,
    nutritionalSummary: nutrition,
    mixingInstructions,
    warnings,
    structuredList,
    substitutionsMade,
  };
}
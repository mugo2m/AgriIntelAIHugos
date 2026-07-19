// lib/dairyConcentrateFeedFormulation.ts
// DAIRY CONCENTRATE FEED FORMULATION ENGINE
// This module calculates a daily concentrate supplement using a commercial concentrate
// mixed with maize, salt, and calcium/minerals, fed alongside forage.
// All costs are in the base currency of the selected country.

export interface DairyConcentrateIngredient {
  name: string;
  amountKg: number;
  cost: number;
  pricePerKg: number;
  percentDM: number;
}

export interface DairyConcentrateResult {
  ingredients: DairyConcentrateIngredient[];
  totalCostPerDay: number;
  forageDM: number;
  concentrateMixDM: number;
  totalDMI: number;
  cpPercent: number;        // overall ration CP %
  meMcal: number;           // overall ME Mcal/kg DM
  ndfPercent: number;       // overall NDF %
  caPercent: number;
  pPercent: number;
  saltPercent: number;
  warnings: string[];
  mixingInstructions: string;
  structuredList: Array<{ key: string; params: { content: string } }>;
  substitutionsMade?: string[];
}

// ========== CONCENTRATE DATABASE ==========
interface ConcentrateProduct {
  brand: string;
  product: string;
  cp: number;           // % crude protein
  me: number;           // Mcal/kg DM
  ndf: number;          // % NDF (estimate)
  ca: number;           // % calcium
  p: number;            // % phosphorus
  salt: number;         // % salt (if any)
  dm: number;           // dry matter fraction (typically 0.88)
  defaultInclusionMin: number; // kg/cow/day (min)
  defaultInclusionMax: number; // kg/cow/day (max)
  defaultPrice: number; // KES per kg as fed
}

const CONCENTRATE_DB: ConcentrateProduct[] = [
  { brand: 'Koudijs', product: 'Dairy Concentrate 16%', cp: 16, me: 2.8, ndf: 20, ca: 0.8, p: 0.5, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.0, defaultPrice: 120 },
  { brand: 'Koudijs', product: 'Dairy Concentrate 18%', cp: 18, me: 2.9, ndf: 20, ca: 0.8, p: 0.5, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.5, defaultPrice: 130 },
  { brand: 'Unga Farm Care', product: 'Dairy Layer/Concentrate', cp: 16, me: 2.7, ndf: 22, ca: 0.7, p: 0.4, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 3.5, defaultPrice: 110 },
  { brand: 'Afrimach', product: 'Dairy Concentrate', cp: 16, me: 2.8, ndf: 20, ca: 0.7, p: 0.4, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 3.0, defaultPrice: 105 },
  { brand: 'Jubaili', product: 'Dairy Concentrate', cp: 16, me: 2.7, ndf: 22, ca: 0.7, p: 0.4, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.0, defaultPrice: 100 },
  { brand: 'Farmers Choice', product: 'Dairy Meal', cp: 15, me: 2.6, ndf: 22, ca: 0.7, p: 0.4, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 3.5, defaultPrice: 100 },
  { brand: 'Royal Dutch', product: 'Dairy Concentrate', cp: 18, me: 2.9, ndf: 20, ca: 0.8, p: 0.5, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.0, defaultPrice: 130 },
  { brand: 'Hendrix', product: 'Dairy Concentrate', cp: 16, me: 2.8, ndf: 20, ca: 0.8, p: 0.5, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.0, defaultPrice: 120 },
  { brand: 'Intraco', product: 'Dairy Concentrate 5%', cp: 18, me: 2.8, ndf: 20, ca: 0.8, p: 0.5, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 3.0, defaultPrice: 150 },
  { brand: 'Cargill', product: 'Dairy Concentrate', cp: 16, me: 2.7, ndf: 22, ca: 0.7, p: 0.4, salt: 0.3, dm: 0.88, defaultInclusionMin: 2.0, defaultInclusionMax: 4.0, defaultPrice: 115 },
];

// ========== FORAGE NUTRIENT DATABASE (from dairyFeedFormulation) ==========
interface ForageNutrient {
  cp: number;
  me: number;
  ndf: number;
  ca: number;
  p: number;
  salt: number;
  dm: number;
}

const FORAGE_DB: Record<string, ForageNutrient> = {
  'napier grass': { cp: 8, me: 2.0, ndf: 65, ca: 0.4, p: 0.2, salt: 0, dm: 0.25 },
  'rhodes hay': { cp: 7, me: 1.9, ndf: 68, ca: 0.3, p: 0.2, salt: 0, dm: 0.88 },
  'lucerne hay': { cp: 18, me: 2.2, ndf: 45, ca: 1.2, p: 0.25, salt: 0, dm: 0.9 },
  'maize silage': { cp: 8, me: 2.5, ndf: 45, ca: 0.2, p: 0.2, salt: 0, dm: 0.35 },
  'oat hay': { cp: 9, me: 2.0, ndf: 60, ca: 0.3, p: 0.2, salt: 0, dm: 0.88 },
  'desmodium (fresh)': { cp: 22, me: 2.1, ndf: 40, ca: 0.8, p: 0.3, salt: 0, dm: 0.25 },
  'banana leaves': { cp: 6, me: 1.8, ndf: 70, ca: 0.5, p: 0.15, salt: 0, dm: 0.25 },
  'maize stover': { cp: 4, me: 1.5, ndf: 75, ca: 0.3, p: 0.1, salt: 0, dm: 0.9 },
  'wheat straw': { cp: 3, me: 1.3, ndf: 80, ca: 0.2, p: 0.1, salt: 0, dm: 0.9 },
};

// ========== NUTRIENT TARGETS (same as dairyFeedFormulation) ==========
interface NutrientTarget {
  cp: number;
  me: number;
  ndf: number;
  ca: number;
  p: number;
  salt: number;
}

const TARGETS: Record<string, NutrientTarget> = {
  'lactating_high': { cp: 19, me: 2.9, ndf: 25, ca: 0.9, p: 0.5, salt: 0.4 },
  'lactating_med':  { cp: 17, me: 2.7, ndf: 27, ca: 0.8, p: 0.45, salt: 0.4 },
  'lactating_low':  { cp: 15, me: 2.5, ndf: 28, ca: 0.7, p: 0.4, salt: 0.4 },
  'dry_cow':        { cp: 12, me: 2.4, ndf: 32, ca: 0.6, p: 0.35, salt: 0.3 },
  'heifer':         { cp: 14, me: 2.5, ndf: 30, ca: 0.6, p: 0.4, salt: 0.3 },
  'calf_starter':   { cp: 20, me: 3.0, ndf: 20, ca: 0.7, p: 0.5, salt: 0.3 },
};

// ========== PRICE HELPERS (reuse from dairyFeedFormulation) ==========
const DEFAULT_PRICES: Record<string, number> = {
  'maize': 40,
  'salt': 50,
  'limestone flour': 20,
  'dcp': 120,
};

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

// ========== MAIN ENGINE ==========
export function formulateDairyConcentrateFeed(params: {
  cowCategory: 'lactating' | 'dry' | 'heifer' | 'calf';
  bodyWeightKg: number;
  milkYieldL?: number;
  milkFatPercent?: number;
  concentrateBrand: string;
  concentrateProduct: string;
  forageType: string;        // e.g., 'napier grass'
  forageKgAsFed: number;     // kg per cow per day
  maizeKgPerDay?: number;    // optional, farmer may specify
  saltKgPerDay?: number;     // optional
  calciumSource: 'limestone' | 'dcp' | 'oyster shell' | 'none';
  calciumKgPerDay?: number;  // optional
  country: string;
  customPrices?: Record<string, number>;
}): DairyConcentrateResult {
  // Normalize
  const category = params.cowCategory;
  const bw = params.bodyWeightKg;
  const milkYield = params.milkYieldL || 0;
  const milkFat = params.milkFatPercent || 4.0;
  const country = params.country;
  const customPrices = params.customPrices || {};

  // 1. Find concentrate product
  const concProd = CONCENTRATE_DB.find(
    p => p.brand === params.concentrateBrand && p.product === params.concentrateProduct
  );
  if (!concProd) {
    throw new Error(`Concentrate product not found: ${params.concentrateBrand} ${params.concentrateProduct}`);
  }

  // 2. Determine target based on category and milk yield
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

  // 3. Estimate DMI
  let dmi = 0;
  if (category === 'lactating') {
    const fcm = milkYield * (0.4 + 0.15 * (milkFat / 3.5));
    dmi = 0.02 * bw + 0.3 * (fcm / 100);
    if (dmi < 0.025 * bw) dmi = 0.025 * bw;
  } else if (category === 'dry') {
    dmi = 0.02 * bw;
  } else if (category === 'heifer') {
    dmi = 0.025 * bw;
  } else { // calf
    dmi = 0.03 * bw;
  }
  if (dmi < 0.1) dmi = 0.1;

  // 4. Forage contribution
  const forageNut = FORAGE_DB[params.forageType.toLowerCase().trim()];
  if (!forageNut) {
    throw new Error(`Forage type not recognized: ${params.forageType}`);
  }
  const forageDM = params.forageKgAsFed * forageNut.dm;
  const remainingDM = dmi - forageDM;
  if (remainingDM < 0) {
    throw new Error(`Forage DM (${forageDM.toFixed(2)} kg) exceeds estimated DMI (${dmi.toFixed(2)} kg). Reduce forage or increase DMI.`);
  }

  // 5. Determine concentrate and maize amounts
  // The farmer may specify maize and salt amounts; we'll fill the rest with concentrate.
  let maizeKg = params.maizeKgPerDay || 0;
  let saltKg = params.saltKgPerDay || 0;
  let calciumKg = params.calciumKgPerDay || 0;

  // We need to allocate remainingDM between concentrate and maize (and minerals)
  // We'll solve for concentrate and maize to meet CP and ME.
  // Concentrate nutrient values
  const concCP = concProd.cp;
  const concME = concProd.me;
  const maizeCP = 9; // %
  const maizeME = 3.4; // Mcal/kg DM

  // We'll assume minerals are negligible for CP/ME.
  // We'll use a simple equation:
  // Let x = concentrate DM (kg), y = maize DM (kg)
  // x + y = remainingDM - mineralDM (mineralDM ~0.1 kg)
  const mineralDM = 0.1; // assume 0.1 kg DM for salt+calcium
  const availableDM = remainingDM - mineralDM;
  if (availableDM < 0.1) {
    throw new Error(`Not enough DM for concentrate mix after forage and minerals.`);
  }

  // We need to meet CP and ME targets. For simplicity, we'll set a target CP% for the concentrate mix (based on remaining requirements)
  // The total required CP from remainingDM = target.cp * dmi - forageCP
  // forageCP = forageDM * forageNut.cp/100
  const forageCP = forageDM * (forageNut.cp / 100);
  const targetTotalCP = target.cp * dmi / 100;
  const remainingCP = targetTotalCP - forageCP;
  // Similarly for ME
  const forageME = forageDM * forageNut.me;
  const targetTotalME = target.me * dmi;
  const remainingME = targetTotalME - forageME;

  // Now we have x and y to provide remainingCP and remainingME.
  // x * concCP/100 + y * maizeCP/100 = remainingCP
  // x * concME + y * maizeME = remainingME
  // Solve.
  // Let's convert percentages to fractions.
  const concCPfrac = concCP / 100;
  const maizeCPfrac = maizeCP / 100;

  // Solve for x, y
  // Use determinant method.
  const det = concCPfrac * maizeME - maizeCPfrac * concME;
  if (Math.abs(det) < 0.0001) {
    // If determinant is zero, fallback to simple allocation.
    // Just use concentrate for all remaining DM.
    const x = availableDM;
    const y = 0;
    const result = { x, y };
    // Check CP
    const cpProv = x * concCPfrac + y * maizeCPfrac;
    const meProv = x * concME + y * maizeME;
    // If insufficient, adjust
    // We'll just proceed.
    // Continue with x,y.
  }
  // Solve for x (concentrate DM) and y (maize DM)
  const rhsCP = remainingCP;
  const rhsME = remainingME;
  const x = (rhsCP * maizeME - maizeCPfrac * rhsME) / det;
  const y = (concCPfrac * rhsME - rhsCP * concME) / det;

  // Ensure x and y are non-negative and within limits.
  let xFinal = Math.max(0, x);
  let yFinal = Math.max(0, y);
  // If xFinal + yFinal > availableDM, scale down
  if (xFinal + yFinal > availableDM) {
    const scale = availableDM / (xFinal + yFinal);
    xFinal *= scale;
    yFinal *= scale;
  } else if (xFinal + yFinal < availableDM) {
    // Fill the rest with maize (or concentrate? we'll fill with maize)
    const deficit = availableDM - (xFinal + yFinal);
    yFinal += deficit;
  }

  // Convert DM to as-fed
  const concAsFed = xFinal / concProd.dm;
  const maizeAsFed = yFinal / 0.88; // maize dm ~0.88

  // Minerals: salt and calcium
  // Salt: we'll aim for 0.3-0.5% of DMI
  // Default salt: 0.003 * dmi (DM) -> as-fed salt = saltDM / 0.95
  const saltDMtarget = 0.003 * dmi;
  let saltDM = saltKg * 0.95; // if farmer provides kg, use that; else compute
  if (saltKg === 0) {
    saltDM = saltDMtarget;
  } else {
    saltDM = saltKg * 0.95;
  }
  const saltAsFed = saltDM / 0.95;

  // Calcium source: limestone (38% Ca), DCP (22% Ca), oyster shell (38% Ca)
  let caPercent = 0;
  if (params.calciumSource === 'limestone') caPercent = 38;
  else if (params.calciumSource === 'dcp') caPercent = 22;
  else if (params.calciumSource === 'oyster shell') caPercent = 38;
  else caPercent = 0;

  let calciumDM = 0;
  if (calciumKg > 0) {
    // farmer specified amount
    calciumDM = calciumKg * 0.95; // assume DM
  } else {
    // Estimate needed Ca: target.ca * dmi - forageCa - concentrateCa
    const forageCa = forageDM * (forageNut.ca / 100);
    const concCa = xFinal * (concProd.ca / 100);
    const neededCa = target.ca * dmi / 100 - forageCa - concCa;
    if (neededCa > 0 && caPercent > 0) {
      calciumDM = neededCa / (caPercent / 100);
    } else {
      calciumDM = 0;
    }
  }
  const calciumAsFed = calciumDM / 0.95;

  // Now build ingredient list (as-fed)
  const ingredients: DairyConcentrateIngredient[] = [];

  // 1. Concentrate
  const concPrice = getPrice(concProd.product, country, customPrices) || concProd.defaultPrice;
  ingredients.push({
    name: `${concProd.brand} ${concProd.product}`,
    amountKg: parseFloat(concAsFed.toFixed(3)),
    cost: parseFloat((concAsFed * concPrice).toFixed(2)),
    pricePerKg: concPrice,
    percentDM: parseFloat(((xFinal / dmi) * 100).toFixed(1)),
  });

  // 2. Maize
  const maizePrice = getPrice('maize', country, customPrices);
  ingredients.push({
    name: 'Maize',
    amountKg: parseFloat(maizeAsFed.toFixed(3)),
    cost: parseFloat((maizeAsFed * maizePrice).toFixed(2)),
    pricePerKg: maizePrice,
    percentDM: parseFloat(((yFinal / dmi) * 100).toFixed(1)),
  });

  // 3. Salt
  const saltPrice = getPrice('salt', country, customPrices);
  ingredients.push({
    name: 'Salt',
    amountKg: parseFloat(saltAsFed.toFixed(3)),
    cost: parseFloat((saltAsFed * saltPrice).toFixed(2)),
    pricePerKg: saltPrice,
    percentDM: parseFloat(((saltDM / dmi) * 100).toFixed(1)),
  });

  // 4. Calcium source (if amount > 0.001)
  if (calciumAsFed > 0.001) {
    let caName = 'Limestone flour';
    if (params.calciumSource === 'dcp') caName = 'DCP';
    else if (params.calciumSource === 'oyster shell') caName = 'Oyster shell grit';
    const caPrice = getPrice(caName.toLowerCase(), country, customPrices) || 20;
    ingredients.push({
      name: caName,
      amountKg: parseFloat(calciumAsFed.toFixed(3)),
      cost: parseFloat((calciumAsFed * caPrice).toFixed(2)),
      pricePerKg: caPrice,
      percentDM: parseFloat(((calciumDM / dmi) * 100).toFixed(1)),
    });
  }

  // Calculate total cost
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);

  // Nutritional summary of total ration (forage + concentrate mix)
  // Compute total nutrients
  let totalDM = forageDM + xFinal + yFinal + saltDM + calciumDM;
  let totalCP = forageCP + xFinal * (concProd.cp / 100) + yFinal * (9 / 100);
  let totalME = forageME + xFinal * concProd.me + yFinal * 3.4;
  let totalNDF = forageDM * (forageNut.ndf / 100) + xFinal * (concProd.ndf / 100) + yFinal * (9 / 100); // maize ndf ~9%
  let totalCa = forageDM * (forageNut.ca / 100) + xFinal * (concProd.ca / 100) + yFinal * 0.03 + calciumDM * (caPercent / 100);
  let totalP = forageDM * (forageNut.p / 100) + xFinal * (concProd.p / 100) + yFinal * 0.3 + (params.calciumSource === 'dcp' ? calciumDM * (18 / 100) : 0);
  let totalSalt = forageDM * (forageNut.salt / 100) + xFinal * (concProd.salt / 100) + yFinal * 0 + saltDM;

  if (totalDM === 0) totalDM = 1;
  const cpFinal = (totalCP / totalDM) * 100;
  const meFinal = totalME / totalDM;
  const ndfFinal = (totalNDF / totalDM) * 100;
  const caFinal = (totalCa / totalDM) * 100;
  const pFinal = (totalP / totalDM) * 100;
  const saltFinal = (totalSalt / totalDM) * 100;

  // Warnings
  const warnings: string[] = [];
  if (cpFinal < target.cp - 1) {
    warnings.push(`⚠️ Total ration CP is low (${cpFinal.toFixed(1)}%). Target ${target.cp}%. Increase concentrate or add protein.`);
  }
  if (cpFinal > target.cp + 2) {
    warnings.push(`⚠️ Total ration CP is high (${cpFinal.toFixed(1)}%). Consider reducing concentrate.`);
  }
  if (meFinal < target.me - 0.05) {
    warnings.push(`⚠️ Energy is low (${meFinal.toFixed(2)} Mcal/kg). Increase maize or concentrate.`);
  }
  if (ndfFinal < target.ndf - 3) {
    warnings.push(`⚠️ Fibre (NDF) is low (${ndfFinal.toFixed(1)}%). Increase forage.`);
  }
  if (ndfFinal > target.ndf + 5) {
    warnings.push(`⚠️ Fibre (NDF) is high (${ndfFinal.toFixed(1)}%). Reduce forage or increase concentrate.`);
  }
  if (caFinal < target.ca - 0.1) {
    warnings.push(`⚠️ Calcium is low (${caFinal.toFixed(2)}%). Add more limestone/DCP.`);
  }
  if (pFinal < target.p - 0.05) {
    warnings.push(`⚠️ Phosphorus is low (${pFinal.toFixed(2)}%). Add DCP.`);
  }
  if (saltFinal > 0.6) {
    warnings.push(`⚠️ Salt is high (${saltFinal.toFixed(2)}%). Reduce salt.`);
  }
  if (saltFinal < 0.2) {
    warnings.push(`⚠️ Salt is low (${saltFinal.toFixed(2)}%). Add salt.`);
  }

  // Mixing instructions
  let mixingInstructions = "Mix the concentrate, maize, salt, and calcium source thoroughly to form a uniform concentrate mix.\n";
  mixingInstructions += `- Add the concentrate mix to the forage (${params.forageKgAsFed} kg of ${params.forageType}) and mix well.\n`;
  mixingInstructions += "Feed this TMR (total mixed ration) to the cow.";

  // Structured list
  const structuredList = [
    {
      key: "dairy_concentrate_summary",
      params: {
        content: `Concentrate mix for ${category} cow, ${bw} kg, milk ${milkYield} L/day`
      }
    },
    {
      key: "dairy_concentrate_ingredients",
      params: {
        content: `Ingredients (kg/cow/day):\n${ingredients.map(ing => `${ing.name}: ${ing.amountKg.toFixed(2)} kg (${ing.cost.toFixed(2)})`).join('\n')}`
      }
    },
    {
      key: "dairy_concentrate_nutrition",
      params: {
        content: `Total Ration: DMI ${totalDM.toFixed(2)} kg, CP ${cpFinal.toFixed(1)}%, ME ${meFinal.toFixed(2)} Mcal/kg, NDF ${ndfFinal.toFixed(1)}%, Ca ${caFinal.toFixed(2)}%, P ${pFinal.toFixed(2)}%, Salt ${saltFinal.toFixed(2)}%`
      }
    },
    {
      key: "dairy_concentrate_cost",
      params: {
        content: `Total daily feed cost: ${totalCost.toFixed(2)}`
      }
    },
    {
      key: "dairy_concentrate_mixing",
      params: {
        content: mixingInstructions
      }
    }
  ];

  if (warnings.length > 0) {
    structuredList.push({
      key: "dairy_concentrate_warnings",
      params: {
        content: `Warnings:\n${warnings.join('\n')}`
      }
    });
  }

  return {
    ingredients,
    totalCostPerDay: totalCost,
    forageDM,
    concentrateMixDM: xFinal + yFinal + saltDM + calciumDM,
    totalDMI: totalDM,
    cpPercent: cpFinal,
    meMcal: meFinal,
    ndfPercent: ndfFinal,
    caPercent: caFinal,
    pPercent: pFinal,
    saltPercent: saltFinal,
    warnings,
    mixingInstructions,
    structuredList,
  };
}
// lib/soilTestInterpreter.ts

export interface SoilTestResults {
  // Basic soil properties
  ph: number;
  phRating: string;
  phosphorus: number;
  phosphorusRating: string;
  potassium: number;
  potassiumRating: string;
  calcium?: number;
  calciumRating?: string;
  magnesium?: number;
  magnesiumRating?: string;
  totalNitrogen?: number;
  totalNitrogenRating?: string;
  organicCarbon?: number;
  organicCarbonRating?: string;
  organicMatter?: number;
  organicMatterRating?: string;
  cec?: number;
  cecRating?: string;
  sodium?: number;
  sodiumRating?: string;

  // NEW: Secondary nutrients and micronutrients
  sulfur?: number;
  sulfurRating?: string;
  zinc?: number;
  zincRating?: string;
  boron?: number;
  boronRating?: string;
  copper?: number;
  copperRating?: string;
  manganese?: number;
  manganeseRating?: string;
  iron?: number;
  ironRating?: string;
  molybdenum?: number;
  molybdenumRating?: string;

  // Recommendation fields
  targetYield?: number;
  recPlantingFertilizer?: string;
  recPlantingQuantity?: number;
  recTopdressingFertilizer?: string;
  recTopdressingQuantity?: number;
  recPotassiumFertilizer?: string;
  recPotassiumQuantity?: number;
  recCalciticLime?: number;

  // NEW: Nutrient detail fields from farmer input
  plantingFertilizerNutrients?: string;
  topdressingFertilizerNutrients?: string;
  potassiumFertilizerNutrients?: string;

  // Crop information
  crop?: string;
  farmSize?: number;
}

// Crop-specific nutrient requirements (kg per ton of yield) - UPDATED with secondary nutrients
export const cropNutrientRequirements: Record<string, { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number; b?: number }> = {
  // Cereals & Grains
  maize: { n: 20, p: 8, k: 20, s: 4, zn: 0.1 },
  rice: { n: 15, p: 6, k: 15, s: 3, zn: 0.2 },
  wheat: { n: 22, p: 8, k: 18, s: 5 },
  sorghum: { n: 18, p: 7, k: 16, s: 4 },
  barley: { n: 20, p: 8, k: 17, s: 4 },
  oats: { n: 18, p: 7, k: 15 },
  'finger millet': { n: 16, p: 6, k: 14 },

  // Legumes & Pulses (nitrogen-fixing)
  beans: { n: 0, p: 15, k: 20, s: 5, mg: 2, zn: 0.2 },
  cowpeas: { n: 0, p: 12, k: 18, s: 4 },
  'green grams': { n: 0, p: 12, k: 18, s: 4 },
  'soya beans': { n: 0, p: 18, k: 22, s: 6, zn: 0.3 },
  groundnuts: { n: 0, p: 15, k: 20, s: 5, ca: 5 },
  pigeonpeas: { n: 0, p: 10, k: 15 },
  'bambara nuts': { n: 0, p: 12, k: 15 },

  // Root & Tuber Crops
  potatoes: { n: 25, p: 10, k: 30, s: 5, mg: 3, zn: 0.2 },
  'sweet potatoes': { n: 20, p: 8, k: 25, s: 4 },
  cassava: { n: 18, p: 6, k: 22, s: 3 },
  yams: { n: 15, p: 8, k: 20, s: 3 },
  taro: { n: 12, p: 6, k: 15 },
  carrots: { n: 15, p: 8, k: 20, s: 4, ca: 3, b: 0.2 },

  // Vegetables
  tomatoes: { n: 25, p: 10, k: 30, s: 5, ca: 8, mg: 3, zn: 0.2, b: 0.1 },
  onions: { n: 15, p: 8, k: 15, s: 6, zn: 0.2 },
  cabbages: { n: 20, p: 8, k: 22, s: 5, ca: 6 },
  kales: { n: 18, p: 7, k: 20, s: 4, ca: 5 },
  spinach: { n: 20, p: 8, k: 20, s: 4, mg: 2 },
  capsicums: { n: 18, p: 8, k: 22, s: 4, ca: 4, zn: 0.2 },
  chillies: { n: 18, p: 8, k: 22, s: 4, ca: 4, zn: 0.2 },
  brinjals: { n: 18, p: 8, k: 20 },
  'french beans': { n: 0, p: 12, k: 18, s: 4, zn: 0.2 },
  'garden peas': { n: 0, p: 12, k: 18 },
  okra: { n: 18, p: 8, k: 18, s: 3 },
  cauliflower: { n: 20, p: 8, k: 22, s: 5, b: 0.2 },

  // Fruits
  bananas: { n: 12, p: 4, k: 18, s: 3, mg: 2, zn: 0.1 },
  oranges: { n: 10, p: 5, k: 15, s: 3, zn: 0.2 },
  mangoes: { n: 10, p: 5, k: 15, s: 3, zn: 0.2 },
  pineapples: { n: 8, p: 4, k: 12, s: 2, mg: 1 },
  avocados: { n: 10, p: 5, k: 15, s: 3, zn: 0.3, b: 0.2 },
  pawpaws: { n: 12, p: 5, k: 16 },
  'passion fruit': { n: 15, p: 6, k: 18, s: 3 },
  citrus: { n: 10, p: 5, k: 15, s: 3, zn: 0.2 },
  watermelon: { n: 12, p: 6, k: 18, s: 3, mg: 2 },

  // Cash Crops
  coffee: { n: 20, p: 8, k: 22, s: 4, zn: 0.2, b: 0.1 },
  tea: { n: 25, p: 5, k: 5, s: 3, mg: 2 },
  cocoa: { n: 12, p: 6, k: 15, s: 3, zn: 0.2 },
  cotton: { n: 18, p: 8, k: 18, s: 4 },
  sugarcane: { n: 15, p: 5, k: 15, s: 4 },
  tobacco: { n: 20, p: 10, k: 25 },
  sunflower: { n: 18, p: 8, k: 20, s: 4 },
  simsim: { n: 15, p: 7, k: 15 },
  pyrethrum: { n: 16, p: 8, k: 18 },

  // Nuts
  groundnuts: { n: 0, p: 15, k: 20, s: 5, ca: 5 },
  macadamia: { n: 15, p: 8, k: 15, s: 3, zn: 0.3, b: 0.2 },

  // Cover Crops
  mucuna: { n: 0, p: 5, k: 10 },
  desmodium: { n: 0, p: 5, k: 10 },
  dolichos: { n: 0, p: 5, k: 10 },
  canavalia: { n: 0, p: 5, k: 10 }
};

// Fertilizer composition database - UPDATED with secondary nutrients
export const fertilizerComposition: Record<string, { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number; b?: number; cu?: number; mn?: number }> = {
  // Common fertilizers
  'DAP': { n: 18, p: 46, k: 0 },
  'TSP': { n: 0, p: 46, k: 0 },
  'SSP': { n: 0, p: 20, k: 0, s: 12 },
  'UREA': { n: 46, p: 0, k: 0 },
  'CAN': { n: 27, p: 0, k: 0, ca: 8 },
  'MOP': { n: 0, p: 0, k: 60 },
  'SOP': { n: 0, p: 0, k: 50, s: 18 },
  'NPK 23:23:0': { n: 23, p: 23, k: 0 },
  'NPK 17:17:17': { n: 17, p: 17, k: 17 },
  'NPK 20:20:20': { n: 20, p: 20, k: 20 },
  'NPK 20:10:10': { n: 20, p: 10, k: 10 },
  'NPK 25:5:5': { n: 25, p: 5, k: 5 },
  'NPK 12:24:12': { n: 12, p: 24, k: 12 },
  'NPK 10:26:10': { n: 10, p: 26, k: 10 },
  'NPK 23:10:10': { n: 23, p: 10, k: 10 },
  'NPK 26:0:20': { n: 26, p: 0, k: 20 },

  // Compound fertilizers
  'Compound 20:20:0': { n: 20, p: 20, k: 0 },
  'Compound 23:23:0': { n: 23, p: 23, k: 0 },
  'Compound 17:17:17': { n: 17, p: 17, k: 17 },

  // Organic options
  'Farmyard manure': { n: 0.5, p: 0.2, k: 0.5 },
  'Compost': { n: 1, p: 0.3, k: 0.8 },
  'Neem cake': { n: 5, p: 1, k: 2 }
};

// Crop yield categories (tons per acre)
export const cropYieldCategories: Record<string, { low: number; medium: number; high: number }> = {
  maize: { low: 1.5, medium: 2.5, high: 4 },
  beans: { low: 0.8, medium: 1.2, high: 1.8 },
  rice: { low: 2, medium: 3, high: 5 },
  potatoes: { low: 8, medium: 12, high: 18 },
  tomatoes: { low: 10, medium: 15, high: 25 },
  onions: { low: 6, medium: 8, high: 12 },
  cabbages: { low: 8, medium: 12, high: 18 },
  kales: { low: 6, medium: 8, high: 12 },
  bananas: { low: 4, medium: 6, high: 10 },
  mangoes: { low: 5, medium: 8, high: 15 },
  avocados: { low: 5, medium: 8, high: 15 },
  coffee: { low: 1.5, medium: 2, high: 3 },
  tea: { low: 1.5, medium: 2.5, high: 4 },
  macadamia: { low: 2, medium: 4, high: 6 },
  cocoa: { low: 0.5, medium: 0.8, high: 1.5 }
};

export class SoilTestInterpreter {

  // Interpret soil test data - UPDATED with secondary nutrients
  interpretSoilTest(data: any): SoilTestResults {
    // Parse ratings based on values
    const getPHRating = (ph: number): string => {
      if (ph < 5.0) return "Very Low";
      if (ph < 5.5) return "Low";
      if (ph < 6.5) return "Optimum";
      if (ph < 7.5) return "High";
      return "Very High";
    };

    const getPRating = (p: number): string => {
      if (p < 10) return "Very Low";
      if (p < 20) return "Low";
      if (p < 30) return "Optimum";
      if (p < 40) return "High";
      return "Very High";
    };

    const getKRating = (k: number): string => {
      if (k < 50) return "Very Low";
      if (k < 100) return "Low";
      if (k < 150) return "Optimum";
      if (k < 200) return "High";
      return "Very High";
    };

    const getCaRating = (ca: number): string => {
      if (ca < 200) return "Very Low";
      if (ca < 400) return "Low";
      if (ca < 800) return "Optimum";
      if (ca < 1200) return "High";
      return "Very High";
    };

    const getMgRating = (mg: number): string => {
      if (mg < 50) return "Very Low";
      if (mg < 100) return "Low";
      if (mg < 200) return "Optimum";
      if (mg < 300) return "High";
      return "Very High";
    };

    const getNRating = (n: number): string => {
      if (n < 0.1) return "Very Low";
      if (n < 0.2) return "Low";
      if (n < 0.3) return "Optimum";
      if (n < 0.4) return "High";
      return "Very High";
    };

    const getOMRating = (om: number): string => {
      if (om < 1) return "Very Low";
      if (om < 2) return "Low";
      if (om < 4) return "Optimum";
      if (om < 6) return "High";
      return "Very High";
    };

    const getCECRating = (cec: number): string => {
      if (cec < 5) return "Very Low";
      if (cec < 10) return "Low";
      if (cec < 15) return "Optimum";
      if (cec < 20) return "High";
      return "Very High";
    };

    // NEW: Secondary nutrient rating functions
    const getSRating = (s: number): string => {
      if (s < 5) return "Very Low";
      if (s < 10) return "Low";
      if (s < 20) return "Optimum";
      if (s < 30) return "High";
      return "Very High";
    };

    const getZnRating = (zn: number): string => {
      if (zn < 0.5) return "Very Low";
      if (zn < 1) return "Low";
      if (zn < 2) return "Optimum";
      if (zn < 4) return "High";
      return "Very High";
    };

    const getBRating = (b: number): string => {
      if (b < 0.2) return "Very Low";
      if (b < 0.5) return "Low";
      if (b < 1) return "Optimum";
      if (b < 2) return "High";
      return "Very High";
    };

    const getCuRating = (cu: number): string => {
      if (cu < 0.2) return "Very Low";
      if (cu < 0.5) return "Low";
      if (cu < 1) return "Optimum";
      if (cu < 2) return "High";
      return "Very High";
    };

    const getMnRating = (mn: number): string => {
      if (mn < 5) return "Very Low";
      if (mn < 10) return "Low";
      if (mn < 20) return "Optimum";
      if (mn < 40) return "High";
      return "Very High";
    };

    const getFeRating = (fe: number): string => {
      if (fe < 2) return "Very Low";
      if (fe < 5) return "Low";
      if (fe < 10) return "Optimum";
      if (fe < 20) return "High";
      return "Very High";
    };

    const getMoRating = (mo: number): string => {
      if (mo < 0.05) return "Very Low";
      if (mo < 0.1) return "Low";
      if (mo < 0.2) return "Optimum";
      if (mo < 0.5) return "High";
      return "Very High";
    };

    const base = {
      ph: data.soilTestPH,
      phRating: getPHRating(data.soilTestPH),
      phosphorus: data.soilTestP,
      phosphorusRating: getPRating(data.soilTestP),
      potassium: data.soilTestK,
      potassiumRating: getKRating(data.soilTestK),
      calcium: data.soilTestCa,
      calciumRating: getCaRating(data.soilTestCa),
      magnesium: data.soilTestMg,
      magnesiumRating: getMgRating(data.soilTestMg),
      totalNitrogen: data.soilTestNPercent,
      totalNitrogenRating: getNRating(data.soilTestNPercent),
      organicCarbon: data.soilTestOC,
      organicCarbonRating: data.soilTestOCRating,
      organicMatter: data.soilTestOM,
      organicMatterRating: getOMRating(data.soilTestOM),
      cec: data.soilTestCEC,
      cecRating: getCECRating(data.soilTestCEC),
      sodium: data.soilTestNa,
      sodiumRating: data.soilTestNaRating,

      // NEW: Secondary nutrients
      sulfur: data.soilTestS,
      sulfurRating: data.soilTestS ? getSRating(data.soilTestS) : undefined,
      zinc: data.soilTestZn,
      zincRating: data.soilTestZn ? getZnRating(data.soilTestZn) : undefined,
      boron: data.soilTestB,
      boronRating: data.soilTestB ? getBRating(data.soilTestB) : undefined,
      copper: data.soilTestCu,
      copperRating: data.soilTestCu ? getCuRating(data.soilTestCu) : undefined,
      manganese: data.soilTestMn,
      manganeseRating: data.soilTestMn ? getMnRating(data.soilTestMn) : undefined,
      iron: data.soilTestFe,
      ironRating: data.soilTestFe ? getFeRating(data.soilTestFe) : undefined,
      molybdenum: data.soilTestMo,
      molybdenumRating: data.soilTestMo ? getMoRating(data.soilTestMo) : undefined,
    };

    // Add recommendations if present
    return {
      ...base,
      targetYield: data.targetYield,
      recPlantingFertilizer: data.recPlantingFertilizer,
      recPlantingQuantity: data.recPlantingQuantity,
      recTopdressingFertilizer: data.recTopdressingFertilizer,
      recTopdressingQuantity: data.recTopdressingQuantity,
      recPotassiumFertilizer: data.recPotassiumFertilizer,
      recPotassiumQuantity: data.recPotassiumQuantity,
      recCalciticLime: data.recCalciticLime,
      // NEW: Nutrient detail fields
      plantingFertilizerNutrients: data.plantingFertilizerNutrients,
      topdressingFertilizerNutrients: data.topdressingFertilizerNutrients,
      potassiumFertilizerNutrients: data.potassiumFertilizerNutrients,
      crop: data.crops,
      farmSize: data.cropAcres
    };
  }

  // Calculate lime requirement based on pH and crop (calcitic)
  calculateLimeRequirement(ph: number, targetPh: number = 6.5, soilType: string = 'medium'): number {
    if (ph >= targetPh) return 0;

    // pH adjustment factors (kg lime per acre to raise pH by 0.1)
    const factors: Record<string, number> = {
      'sandy': 40,
      'sandy loam': 60,
      'loam': 80,
      'clay loam': 100,
      'clay': 120,
      'medium': 80 // default
    };

    const factor = factors[soilType] || 80;
    const diff = targetPh - ph;
    return Math.round(diff * 10 * factor);
  }

  /**
   * Get dolomitic lime recommendation based on magnesium level and Ca:Mg ratio
   * Similar to calcitic lime recommendation but for magnesium deficiency or imbalance.
   */
  getDolomiticLimeRecommendation(soilTest: SoilTestResults): {
    needed: boolean;
    kgPerAcre: number;
    reason: string;
    costEstimate: number;
  } {
    const mg = soilTest.magnesium || 0;
    const ca = soilTest.calcium || 0;
    const caMgRatio = ca / (mg || 1);

    // Conditions to recommend dolomitic lime
    const mgLow = mg < 100; // ppm threshold
    const caMgImbalanced = caMgRatio < 2 || caMgRatio > 10; // ideal is 5-10:1

    if (!mgLow && !caMgImbalanced) {
      return { needed: false, kgPerAcre: 0, reason: "Magnesium adequate", costEstimate: 0 };
    }

    // Calculate rate: ~0.5-1.5 kg per ppm deficit (simplified)
    let kgPerAcre = 0;
    if (mgLow) {
      const mgDeficit = Math.max(0, 100 - mg);
      kgPerAcre = mgDeficit * 1.2; // ~120 kg for Mg=0 → 100 ppm deficit
    }
    if (caMgImbalanced && !mgLow) {
      kgPerAcre = 80; // base rate for imbalance correction
    }
    kgPerAcre = Math.min(Math.max(kgPerAcre, 50), 300); // clamp between 50-300 kg/acre

    let reason = "";
    if (mgLow && caMgImbalanced) {
      reason = `Your magnesium is low (${mg} ppm) and Ca:Mg ratio is ${caMgRatio.toFixed(1)}:1. Dolomitic lime corrects both.`;
    } else if (mgLow) {
      reason = `Your magnesium is low (${mg} ppm). Dolomitic lime adds magnesium without raising calcium too high.`;
    } else {
      reason = `Your Ca:Mg ratio is ${caMgRatio.toFixed(1)}:1 (ideal 5-10:1). Dolomitic lime balances the ratio.`;
    }

    const pricePer50kg = 300; // Ksh, adjustable – could be made configurable
    const bags = Math.ceil(kgPerAcre / 50);
    const costEstimate = bags * pricePer50kg;

    return { needed: true, kgPerAcre, reason, costEstimate };
  }

  // Calculate nutrient requirements for specific crop - UPDATED with secondary nutrients
  calculateCropNutrientRequirements(
    crop: string,
    targetYieldTons: number,
    soilTest: SoilTestResults
  ): { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number; b?: number; recommendations: string[] } {

    const requirements = cropNutrientRequirements[crop.toLowerCase()] || { n: 15, p: 8, k: 15 };

    // Calculate total nutrients needed
    const totalN = requirements.n * targetYieldTons;
    const totalP = requirements.p * targetYieldTons;
    const totalK = requirements.k * targetYieldTons;
    const totalS = requirements.s ? requirements.s * targetYieldTons : 0;
    const totalCa = requirements.ca ? requirements.ca * targetYieldTons : 0;
    const totalMg = requirements.mg ? requirements.mg * targetYieldTons : 0;
    const totalZn = requirements.zn ? requirements.zn * targetYieldTons : 0;
    const totalB = requirements.b ? requirements.b * targetYieldTons : 0;

    // Adjust based on soil test levels
    const soilPLevel = soilTest.phosphorus || 0;
    const soilKLevel = soilTest.potassium || 0;
    const soilCaLevel = soilTest.calcium || 0;
    const soilMgLevel = soilTest.magnesium || 0;
    const soilZnLevel = soilTest.zinc || 0;
    const soilBLevel = soilTest.boron || 0;

    // Phosphorus adjustment
    const pAdjustment = soilPLevel > 30 ? 0.5 : soilPLevel > 20 ? 0.8 : 1;

    // Potassium adjustment
    const kAdjustment = soilKLevel > 150 ? 0.5 : soilKLevel > 100 ? 0.8 : 1;

    // Calcium adjustment (only if low)
    const caAdjustment = soilCaLevel > 800 ? 0.5 : soilCaLevel > 400 ? 0.8 : 1;

    // Magnesium adjustment
    const mgAdjustment = soilMgLevel > 200 ? 0.5 : soilMgLevel > 100 ? 0.8 : 1;

    // Zinc adjustment
    const znAdjustment = soilZnLevel > 2 ? 0.5 : soilZnLevel > 1 ? 0.8 : 1;

    // Boron adjustment
    const bAdjustment = soilBLevel > 1 ? 0.5 : soilBLevel > 0.5 ? 0.8 : 1;

    const adjustedN = totalN;
    const adjustedP = totalP * pAdjustment;
    const adjustedK = totalK * kAdjustment;
    const adjustedS = totalS;
    const adjustedCa = totalCa * caAdjustment;
    const adjustedMg = totalMg * mgAdjustment;
    const adjustedZn = totalZn * znAdjustment;
    const adjustedB = totalB * bAdjustment;

    // Generate fertilizer recommendations
    const recommendations: string[] = [];

    // Phosphorus source
    if (adjustedP > 0) {
      if (adjustedP < 20) {
        recommendations.push(`Apply TSP: ${Math.round(adjustedP / 0.46)} kg/acre`);
      } else {
        recommendations.push(`Apply DAP: ${Math.round(adjustedP / 0.46)} kg/acre (provides ${Math.round(adjustedP / 0.46 * 0.18)} kg N)`);
      }
    }

    // Nitrogen topdressing
    if (adjustedN > 0) {
      recommendations.push(`Topdress with CAN: ${Math.round(adjustedN / 0.27)} kg/acre`);
      recommendations.push(`Alternative: UREA ${Math.round(adjustedN / 0.46)} kg/acre`);
    }

    // Potassium
    if (adjustedK > 0) {
      recommendations.push(`Apply MOP: ${Math.round(adjustedK / 0.6)} kg/acre`);
    }

    // Sulfur
    if (adjustedS > 0) {
      recommendations.push(`Apply SSP (0-20-0) or ASN: ${Math.round(adjustedS / 0.12)} kg/acre for sulfur`);
    }

    // Zinc
    if (adjustedZn > 0) {
      recommendations.push(`Apply Zinc fertilizer: ${Math.round(adjustedZn / 0.1)} kg/acre`);
    }

    // Boron
    if (adjustedB > 0) {
      recommendations.push(`Apply Boron fertilizer: ${Math.round(adjustedB / 0.1)} kg/acre`);
    }

    return {
      n: Math.round(adjustedN * 10) / 10,
      p: Math.round(adjustedP * 10) / 10,
      k: Math.round(adjustedK * 10) / 10,
      s: Math.round(adjustedS * 10) / 10,
      ca: Math.round(adjustedCa * 10) / 10,
      mg: Math.round(adjustedMg * 10) / 10,
      zn: Math.round(adjustedZn * 10) / 10,
      b: Math.round(adjustedB * 10) / 10,
      recommendations
    };
  }

  // Generate recommendation text using farmer's actual recommendations - UPDATED
  generateRecommendationText(soilResults: SoilTestResults): string {
    // If farmer provided their own recommendations, use them
    if (soilResults.recPlantingFertilizer) {
      return this.generateFarmerRecText(soilResults);
    }

    // Otherwise generate based on soil test
    return this.generateSoilBasedText(soilResults);
  }

  // Generate text using farmer's provided recommendations - UPDATED
  private generateFarmerRecText(soilResults: SoilTestResults): string {
    let text = `🌱 **YOUR SOIL TEST RECOMMENDATIONS**\n\n`;

    if (soilResults.crop) {
      text += `**Crop:** ${soilResults.crop.toUpperCase()}\n`;
    }

    if (soilResults.targetYield) {
      text += `**Target Yield:** ${soilResults.targetYield} kg/acre\n\n`;
    } else {
      text += `\n`;
    }

    text += `**PLANTING FERTILIZER:**\n`;
    text += `• ${soilResults.recPlantingFertilizer}\n`;
    if (soilResults.recPlantingQuantity) {
      text += `• Apply ${soilResults.recPlantingQuantity} kg per acre\n`;
    }
    // NEW: Show nutrient details if available
    if (soilResults.plantingFertilizerNutrients && soilResults.plantingFertilizerNutrients !== "No additional nutrients") {
      text += `• Additional nutrients: ${soilResults.plantingFertilizerNutrients}\n`;
    }
    text += `\n`;

    text += `**TOPDRESSING FERTILIZER:**\n`;
    text += `• ${soilResults.recTopdressingFertilizer}\n`;
    if (soilResults.recTopdressingQuantity) {
      text += `• Apply ${soilResults.recTopdressingQuantity} kg per acre\n`;
    }
    // NEW: Show nutrient details if available
    if (soilResults.topdressingFertilizerNutrients && soilResults.topdressingFertilizerNutrients !== "No additional nutrients") {
      text += `• Additional nutrients: ${soilResults.topdressingFertilizerNutrients}\n`;
    }
    text += `\n`;

    if (soilResults.recPotassiumFertilizer) {
      text += `**POTASSIUM FERTILIZER:**\n`;
      text += `• ${soilResults.recPotassiumFertilizer}\n`;
      if (soilResults.recPotassiumQuantity) {
        text += `• Apply ${soilResults.recPotassiumQuantity} kg per acre\n`;
      }
      // NEW: Show nutrient details if available
      if (soilResults.potassiumFertilizerNutrients && soilResults.potassiumFertilizerNutrients !== "No additional nutrients") {
        text += `• Additional nutrients: ${soilResults.potassiumFertilizerNutrients}\n`;
      }
      text += `\n`;
    }

    if (soilResults.recCalciticLime && soilResults.recCalciticLime > 0) {
      text += `**LIME RECOMMENDATION:**\n`;
      text += `• Apply ${soilResults.recCalciticLime} kg calcitic lime per acre\n`;
      text += `• Apply 3-4 weeks before planting\n\n`;
    }

    text += `**NUTRIENTS PROVIDED:**\n`;
    const nutrients = this.calculateNutrientsFromRecs(soilResults);
    text += `• Nitrogen (N): ${nutrients.n.toFixed(1)} kg\n`;
    text += `• Phosphorus (P): ${nutrients.p.toFixed(1)} kg\n`;
    text += `• Potassium (K): ${nutrients.k.toFixed(1)} kg\n`;
    if (nutrients.s && nutrients.s > 0) text += `• Sulfur (S): ${nutrients.s.toFixed(1)} kg\n`;
    if (nutrients.ca && nutrients.ca > 0) text += `• Calcium (Ca): ${nutrients.ca.toFixed(1)} kg\n`;
    if (nutrients.mg && nutrients.mg > 0) text += `• Magnesium (Mg): ${nutrients.mg.toFixed(1)} kg\n`;
    if (nutrients.zn && nutrients.zn > 0) text += `• Zinc (Zn): ${nutrients.zn.toFixed(1)} kg\n`;
    if (nutrients.b && nutrients.b > 0) text += `• Boron (B): ${nutrients.b.toFixed(1)} kg\n\n`;

    text += `**BUSINESS TIP:** Every Ksh 1 invested in soil correction returns Ksh 3-5 in higher yields!\n`;

    return text;
  }

  // Generate text based on soil test analysis - UPDATED
  private generateSoilBasedText(soilResults: SoilTestResults): string {
    let text = `🌱 **SOIL TEST ANALYSIS**\n\n`;

    text += `**pH:** ${soilResults.ph} (${soilResults.phRating})\n`;
    if (soilResults.ph < 5.5) {
      text += `→ Soil is too acidic. Lime recommended.\n`;
    } else if (soilResults.ph > 7.5) {
      text += `→ Soil is too alkaline. Add organic matter.\n`;
    }

    text += `**Phosphorus (P):** ${soilResults.phosphorus} ppm (${soilResults.phosphorusRating})\n`;
    if (soilResults.phosphorus < 15) {
      text += `→ Phosphorus is low. Apply DAP or TSP.\n`;
    }

    text += `**Potassium (K):** ${soilResults.potassium} ppm (${soilResults.potassiumRating})\n`;
    if (soilResults.potassium < 100) {
      text += `→ Potassium is low. Apply MOP or other potassium fertilizer.\n`;
    }

    // NEW: Secondary nutrients
    if (soilResults.sulfur) {
      text += `**Sulfur (S):** ${soilResults.sulfur} ppm (${soilResults.sulfurRating})\n`;
      if (soilResults.sulfur < 10) {
        text += `→ Sulfur is low. Use SSP, ASN or fertilizers with S.\n`;
      }
    }

    if (soilResults.zinc) {
      text += `**Zinc (Zn):** ${soilResults.zinc} ppm (${soilResults.zincRating})\n`;
      if (soilResults.zinc < 1) {
        text += `→ Zinc is low. Apply Zn-fortified fertilizers.\n`;
      }
    }

    if (soilResults.boron) {
      text += `**Boron (B):** ${soilResults.boron} ppm (${soilResults.boronRating})\n`;
      if (soilResults.boron < 0.5) {
        text += `→ Boron is low. Apply B-fortified fertilizers.\n`;
      }
    }

    if (soilResults.totalNitrogen) {
      text += `**Nitrogen (N):** ${soilResults.totalNitrogen}% (${soilResults.totalNitrogenRating})\n`;
    }

    if (soilResults.organicMatter) {
      text += `**Organic Matter:** ${soilResults.organicMatter}% (${soilResults.organicMatterRating})\n`;
    }

    if (soilResults.calcium) {
      text += `**Calcium (Ca):** ${soilResults.calcium} ppm (${soilResults.calciumRating})\n`;
    }

    if (soilResults.magnesium) {
      text += `**Magnesium (Mg):** ${soilResults.magnesium} ppm (${soilResults.magnesiumRating})\n`;
    }

    text += `\n**BUSINESS INSIGHT:** Every Ksh 1 invested in soil correction returns Ksh 3-5 in higher yields!\n`;
    text += `**TEST SOIL YEARLY** to track improvements and adjust inputs.\n`;

    return text;
  }

  // Calculate nutrients from fertilizer recommendations - UPDATED with secondary nutrients
  calculateNutrientsFromRecs(rec: SoilTestResults): { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number; b?: number } {
    const parseFertilizer = (name: string, qty: number) => {
      if (!name || !qty) return { n: 0, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };

      const lowerName = name.toLowerCase();

      // Try to match fertilizer in composition database
      for (const [key, comp] of Object.entries(fertilizerComposition)) {
        if (lowerName.includes(key.toLowerCase())) {
          return {
            n: (comp.n / 100) * qty,
            p: (comp.p / 100) * qty,
            k: (comp.k / 100) * qty,
            s: (comp.s || 0) / 100 * qty,
            ca: (comp.ca || 0) / 100 * qty,
            mg: (comp.mg || 0) / 100 * qty,
            zn: (comp.zn || 0) / 100 * qty,
            b: (comp.b || 0) / 100 * qty
          };
        }
      }

      // Try to extract NPK numbers
      const match = name.match(/(\d+)[^\d]?(\d+)?[^\d]?(\d+)?/);
      if (match) {
        const n = parseInt(match[1]) || 0;
        const p = parseInt(match[2]) || 0;
        const k = parseInt(match[3]) || 0;
        return {
          n: (n / 100) * qty,
          p: (p / 100) * qty,
          k: (k / 100) * qty,
          s: 0, ca: 0, mg: 0, zn: 0, b: 0
        };
      }

      // Common fertilizer names
      if (lowerName.includes('urea')) return { n: 0.46 * qty, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('can')) return { n: 0.27 * qty, p: 0, k: 0, s: 0, ca: 8/100 * qty, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('dap')) return { n: 0.18 * qty, p: 0.46 * qty, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('mop')) return { n: 0, p: 0, k: 0.6 * qty, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('sop')) return { n: 0, p: 0, k: 0.5 * qty, s: 0.18 * qty, ca: 0, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('tsp')) return { n: 0, p: 0.46 * qty, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      if (lowerName.includes('ssp')) return { n: 0, p: 0.2 * qty, k: 0, s: 0.12 * qty, ca: 0, mg: 0, zn: 0, b: 0 };

      return { n: 0, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
    };

    // NEW: Parse nutrient strings from farmer input
    const parseNutrientString = (nutrientStr: string): { s: number; ca: number; mg: number; zn: number; b: number; cu: number; mn: number } => {
      const result = { s: 0, ca: 0, mg: 0, zn: 0, b: 0, cu: 0, mn: 0 };

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
    };

    const planting = parseFertilizer(rec.recPlantingFertilizer || "", rec.recPlantingQuantity || 0);
    const topdressing = parseFertilizer(rec.recTopdressingFertilizer || "", rec.recTopdressingQuantity || 0);
    const potassium = parseFertilizer(rec.recPotassiumFertilizer || "", rec.recPotassiumQuantity || 0);

    // NEW: Parse nutrient strings
    const plantingNutrients = rec.plantingFertilizerNutrients ?
      parseNutrientString(rec.plantingFertilizerNutrients) : null;
    const topdressingNutrients = rec.topdressingFertilizerNutrients ?
      parseNutrientString(rec.topdressingFertilizerNutrients) : null;
    const potassiumNutrients = rec.potassiumFertilizerNutrients ?
      parseNutrientString(rec.potassiumFertilizerNutrients) : null;

    // Calculate base nutrients from fertilizer names
    const base = {
      n: Math.round((planting.n + topdressing.n + potassium.n) * 10) / 10,
      p: Math.round((planting.p + topdressing.p + potassium.p) * 10) / 10,
      k: Math.round((planting.k + topdressing.k + potassium.k) * 10) / 10,
      s: (planting.s || 0) + (topdressing.s || 0) + (potassium.s || 0),
      ca: (planting.ca || 0) + (topdressing.ca || 0) + (potassium.ca || 0),
      mg: (planting.mg || 0) + (topdressing.mg || 0) + (potassium.mg || 0),
      zn: (planting.zn || 0) + (topdressing.zn || 0) + (potassium.zn || 0),
      b: (planting.b || 0) + (topdressing.b || 0) + (potassium.b || 0)
    };

    // Add nutrients from farmer's nutrient strings (percentage of quantity)
    if (plantingNutrients) {
      base.s += (plantingNutrients.s / 100) * (rec.recPlantingQuantity || 0);
      base.ca += (plantingNutrients.ca / 100) * (rec.recPlantingQuantity || 0);
      base.mg += (plantingNutrients.mg / 100) * (rec.recPlantingQuantity || 0);
      base.zn += (plantingNutrients.zn / 100) * (rec.recPlantingQuantity || 0);
      base.b += (plantingNutrients.b / 100) * (rec.recPlantingQuantity || 0);
    }

    if (topdressingNutrients) {
      base.s += (topdressingNutrients.s / 100) * (rec.recTopdressingQuantity || 0);
      base.ca += (topdressingNutrients.ca / 100) * (rec.recTopdressingQuantity || 0);
      base.mg += (topdressingNutrients.mg / 100) * (rec.recTopdressingQuantity || 0);
      base.zn += (topdressingNutrients.zn / 100) * (rec.recTopdressingQuantity || 0);
      base.b += (topdressingNutrients.b / 100) * (rec.recTopdressingQuantity || 0);
    }

    if (potassiumNutrients) {
      base.s += (potassiumNutrients.s / 100) * (rec.recPotassiumQuantity || 0);
      base.ca += (potassiumNutrients.ca / 100) * (rec.recPotassiumQuantity || 0);
      base.mg += (potassiumNutrients.mg / 100) * (rec.recPotassiumQuantity || 0);
      base.zn += (potassiumNutrients.zn / 100) * (rec.recPotassiumQuantity || 0);
      base.b += (potassiumNutrients.b / 100) * (rec.recPotassiumQuantity || 0);
    }

    // Round all values
    return {
      n: base.n,
      p: base.p,
      k: base.k,
      s: Math.round(base.s * 10) / 10,
      ca: Math.round(base.ca * 10) / 10,
      mg: Math.round(base.mg * 10) / 10,
      zn: Math.round(base.zn * 10) / 10,
      b: Math.round(base.b * 10) / 10
    };
  }

  // Get yield category for a crop
  getYieldCategory(crop: string, level: 'low' | 'medium' | 'high' = 'medium'): number {
    const categories = cropYieldCategories[crop.toLowerCase()];
    if (!categories) return 2; // default 2 tons/acre

    return categories[level];
  }

  // Get fertilizer composition - UPDATED
  getFertilizerComposition(name: string): { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number; b?: number } {
    const lowerName = name.toLowerCase();

    for (const [key, comp] of Object.entries(fertilizerComposition)) {
      if (lowerName.includes(key.toLowerCase())) {
        return comp;
      }
    }

    return { n: 0, p: 0, k: 0 };
  }
}

export const soilTestInterpreter = new SoilTestInterpreter();
// types/soilTest.ts
// TypeScript interfaces for soil test data - UPDATED for all 47 crops
// UPDATED: Added transportCostPerKg, emptyBags, plantingAdvice fields

export type NutrientRating = "Very Low" | "Low" | "Optimum" | "High" | "Very High";

// ========== CROP CATEGORIES ==========
export type CropCategory =
  | "cereal" | "legume" | "vegetable" | "fruit" | "tuber"
  | "cash" | "nut" | "spice" | "beverage" | "oil" | "fiber";

export type CropType =
  // Cereals & Grains
  | "maize" | "rice" | "wheat" | "barley" | "sorghum" | "finger millet" | "oats"
  // Legumes & Pulses
  | "beans" | "soya beans" | "cowpeas" | "green grams" | "groundnuts"
  | "pigeon peas" | "bambara nuts" | "french beans" | "garden peas"
  // Vegetables
  | "tomatoes" | "onions" | "cabbages" | "kales" | "spinach" | "carrots"
  | "capsicums" | "chillies" | "brinjals" | "okra" | "cauliflower"
  // Fruits
  | "bananas" | "oranges" | "mangoes" | "avocados" | "pineapples"
  | "pawpaws" | "passion fruit" | "citrus" | "watermelons"
  // Tubers & Roots
  | "potatoes" | "sweet potatoes" | "cassava" | "yams" | "taro" | "arrow roots"
  // Cash Crops
  | "coffee" | "tea" | "cocoa" | "sugarcane" | "cotton" | "tobacco"
  | "sunflower" | "simsim" | "pyrethrum"
  // Nuts
  | "macadamia"
  // Cover Crops
  | "mucuna" | "desmodium" | "dolichos" | "canavalia" | "crotalaria";

// ========== SPACING INTERFACES ==========
export interface SpacingInfo {
  rowCm: number;
  plantCm: number;
  seedsPerHole: number;
  label: string;
  plantsPerAcre: number;
  isValid?: boolean;
  warning?: string;
}

export interface PerPlantInfo {
  plantsPerAcre: number;
  totalPlants: number;
  dapGrams: number;
  ureaGrams: number;
  mopGrams: number;
  totalGrams: number;
  dapGuide: string;
  ureaGuide: string;
  mopGuide: string;
  totalGuide: string;
  isPerennial?: boolean; // For tree crops
  applicationFrequency?: string; // e.g., "Apply annually", "Split into 2 applications"
}

// ========== UNIT CONVERSION ==========
export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  factor: number;
  crop?: string; // Crop-specific conversions
}

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
    low: number; // low management
    medium: number; // medium management
    high: number; // high management
  };
  priceRange: {
    min: number; // Ksh per kg
    max: number; // Ksh per kg
    typical: number; // Ksh per kg
  };
  maturityPeriod: {
    min: number; // months to harvest
    max: number; // months to harvest
    typical: number; // months to harvest
  };
  isPerennial: boolean;
  category: CropCategory;
}

// ========== SOIL TEST RESULTS ==========
export interface SoilTestResults {
  // Basic Info
  testDate: string;
  testAge: number; // months
  crop?: string; // Crop being grown
  farmSize?: number; // Acres

  // pH
  ph: number;
  phRating: NutrientRating;

  // Phosphorus
  phosphorus: number;
  phosphorusRating: NutrientRating;

  // Potassium
  potassium: number;
  potassiumRating: NutrientRating;

  // Calcium
  calcium: number;
  calciumRating: NutrientRating;

  // Magnesium
  magnesium: number;
  magnesiumRating: NutrientRating;

  // Sodium
  sodium: number;
  sodiumRating: NutrientRating;

  // Total Nitrogen
  totalNitrogen: number; // %
  totalNitrogenRating: NutrientRating;

  // Organic Carbon
  organicCarbon: number; // %
  organicCarbonRating: NutrientRating;

  // Organic Matter
  organicMatter: number; // %
  organicMatterRating: NutrientRating;

  // CEC
  cec: number; // meq/100g
  cecRating: NutrientRating;

  // Micronutrients
  zinc?: number;
  zincRating?: NutrientRating;
  copper?: number;
  copperRating?: NutrientRating;
  boron?: number;
  boronRating?: NutrientRating;
  manganese?: number;
  manganeseRating?: NutrientRating;
  iron?: number;
  ironRating?: NutrientRating;
  molybdenum?: number;
  molybdenumRating?: NutrientRating;
  sulphur?: number;
  sulphurRating?: NutrientRating;

  // ========== SOIL TEST RECOMMENDATIONS ==========
  targetYield?: number; // e.g., 27 bags/acre or 2000 kg/acre
  targetYieldUnit?: "bags" | "kg" | "tonnes";

  // Lime recommendation
  recCalciticLime?: number; // kg per acre
  recDolomiticLime?: number; // kg per acre (for Mg deficiency)
  recGypsum?: number; // kg per acre (for sodic soils)

  // Planting fertilizer recommendation
  recPlantingFertilizer?: string; // e.g., "NPK 12.24.12+5S"
  recPlantingQuantity?: number; // e.g., 100 kg per acre
  recPlantingNutrients?: ParsedNutrients; // Nutrients from planting fertilizer

  // Topdressing fertilizer recommendation
  recTopdressingFertilizer?: string; // e.g., "UREA 46-0-0"
  recTopdressingQuantity?: number; // e.g., 90 kg per acre
  recTopdressingNutrients?: ParsedNutrients; // Nutrients from topdressing

  // Potassium fertilizer recommendation
  recPotassiumFertilizer?: string; // e.g., "MOP 0-0-60"
  recPotassiumQuantity?: number; // e.g., 30 kg per acre
  recPotassiumNutrients?: ParsedNutrients; // Nutrients from K fertilizer

  // Total nutrients needed
  totalNutrientsNeeded?: NutrientRequirement;

  // Interpretation notes
  interpretation?: string;
  recommendations?: string[];
}

// ========== INTERFACE FOR SOIL TEST RECOMMENDATIONS INPUT ==========
export interface SoilTestRecommendations {
  targetYield: number;
  targetYieldUnit?: "bags" | "kg" | "tonnes";
  plantingFertilizer: string;  // e.g., "NPK 12.24.12+5S"
  plantingQuantity: number;     // e.g., 100kg per acre
  topdressingFertilizer: string; // e.g., "UREA 46-0-0"
  topdressingQuantity: number;   // e.g., 90kg per acre
  potassiumFertilizer: string;   // e.g., "MOP 0-0-60"
  potassiumQuantity: number;     // e.g., 30kg per acre
  calciticLime?: number;         // kg per acre
  dolomiticLime?: number;        // kg per acre
  gypsum?: number;               // kg per acre
}

// ========== INTERFACE FOR PARSED NUTRIENT VALUES ==========
export interface ParsedNutrients {
  n: number;
  p: number;
  k: number;
  s?: number;
  ca?: number;
  mg?: number;
  zn?: number;
  b?: number;
  mn?: number;
  cu?: number;
  fe?: number;
  mo?: number;
}

// ========== NUTRIENT REQUIREMENT INTERFACE ==========
export interface NutrientRequirement {
  n: number; // kg N per acre needed
  p: number; // kg P per acre needed
  k: number; // kg K per acre needed
  s: number; // kg S per acre needed
  ca: number; // kg Ca per acre needed
  mg: number; // kg Mg per acre needed
  zn: number; // kg Zn per acre needed
  b: number; // kg B per acre needed
  cu?: number; // kg Cu per acre needed
  mn?: number; // kg Mn per acre needed
  fe?: number; // kg Fe per acre needed
  mo?: number; // kg Mo per acre needed
}

// ========== FERTILIZER RECOMMENDATION INTERFACE ==========
export interface FertilizerRecommendation {
  fertilizerId: string;
  brand: string;
  company: string;
  npk: string;
  amountKg: number; // kg for entire farm
  amountPerAcre: number; // kg per acre
  packageSizes: string[];
  pricePer50kg: number;
  totalCost: number; // total cost for this fertilizer
  provides: {
    n: number;      // kg N for entire farm
    p: number;      // kg P for entire farm
    k: number;      // kg K for entire farm
    s?: number;
    ca?: number;
    mg?: number;
    zn?: number;
    b?: number;
  };
  applicationMethod?: string;
  applicationTiming?: string;
  crops?: string[]; // Crops this is recommended for
}

// ========== FERTILIZER BLEND RESULT (ENHANCED) ==========
export interface FertilizerBlendResult {
  // Recommendations scaled to farm size
  plantingRecommendations: FertilizerRecommendation[];
  topDressingRecommendations: FertilizerRecommendation[];

  // Per-acre reference values (for display)
  perAcrePlanting?: FertilizerRecommendation[];
  perAcreTopdressing?: FertilizerRecommendation[];

  // Totals for entire farm
  totalNutrientsProvided: NutrientRequirement;
  remainingNeeds: NutrientRequirement;
  totalCost?: number;
  costPerAcre?: number;

  // Farm information
  farmSize?: number;
  crop?: string;

  // Per-plant information (if spacing provided)
  perPlant?: PerPlantInfo;

  // Lime recommendations
  limeRecommendation?: {
    calcitic: number; // kg per acre
    dolomitic: number; // kg per acre
    gypsum: number; // kg per acre
    totalCost: number;
  };

  // Original soil test summary
  soilTestSummary: SoilTestResults | null;

  // Warnings and notes
  warnings?: string[];
  notes?: string[];
}

// ========== GROSS MARGIN INTERFACES ==========
export interface GrossMarginInput {
  crop: string;
  cropAcres: number;
  actualYield: number;
  yieldUnit: string;
  pricePerUnit: number;
  priceUnit: string;
  seedRate: number;
  seedCost: number;
  plantingFertilizerCost: number;
  plantingFertilizerQuantity: number;
  topdressingFertilizerCost: number;
  topdressingFertilizerQuantity: number;
  potassiumFertilizerCost: number;
  potassiumFertilizerQuantity: number;
  ploughingCost: number;
  plantingLabourCost: number;
  weedingCost: number;
  harvestingCost: number;
  transportCostPerKg: number;      // UPDATED: Now per kg instead of per unit
  transportUnit?: string;           // Optional, defaults to "kg"
  emptyBags: number;                // NEW: Number of empty bags to buy
  bagCost: number;
  otherCosts?: {
    name: string;
    amount: number;
  }[];
}

export interface GrossMarginOutput {
  crop: string;
  cropAcres: number;
  yieldKg: number;
  yieldPerAcre: number;
  pricePerKg: number;
  revenue: number;
  revenuePerAcre: number;

  // Cost breakdown
  seedCost: number;
  seedCostPerAcre: number;
  fertilizerCost: number;
  fertilizerCostPerAcre: number;
  labourCost: number;
  labourCostPerAcre: number;
  transportCost: number;
  transportCostPerAcre: number;
  bagCost: number;
  bagCostPerAcre: number;
  otherCosts?: {
    name: string;
    amount: number;
  }[];
  otherCostsTotal?: number;

  totalCosts: number;
  totalCostsPerAcre: number;

  // Profitability
  grossMargin: number;
  grossMarginPerAcre: number;
  roi: number; // Return on Investment %
  costPerKg: number;
  breakevenPrice: number; // Price needed to cover costs

  // Comparisons
  vsLowManagement?: number; // % difference from low management
  vsHighManagement?: number; // % difference from high management

  // Warnings
  warnings?: string[];
}

// ========== FARMER SESSION INTERFACE ==========
export interface FarmerSession {
  id: string;
  userId: string;
  farmerName: string;
  phoneNumber: string;
  country: string;
  county: string;
  subCounty: string;
  ward: string;
  village: string;

  // Farm details
  totalFarmSize?: number;
  cultivatedAcres?: number;
  waterSources?: string[];

  // Crop details
  crops: string[];
  primaryCrop: string;
  cropVarieties?: string;
  cropAcres?: number;
  season?: string;
  plantingDate?: string;
  plantingAdvice?: "optimal" | "acceptable" | "late" | "no-data";  // NEW
  plantingAdviceText?: string;                                      // NEW

  // Spacing
  spacing?: string; // Selected spacing label
  spacingInfo?: SpacingInfo;
  spacingWarning?: string;

  // Inputs
  seedRate?: number;
  seedCost?: number;
  seedSource?: string;
  useCertifiedSeed?: boolean;

  // Fertilizer information
  plantingFertilizer?: {
    used: boolean;
    type?: string;
    quantity?: number;
    cost?: number;
    reason?: string;
  };
  topdressingFertilizer?: {
    used: boolean;
    type?: string;
    quantity?: number;
    cost?: number;
    reason?: string;
  };
  potassiumFertilizer?: {
    used: boolean;
    type?: string;
    quantity?: number;
    cost?: number;
  };

  // Pests and diseases
  commonPests?: string[];
  commonDiseases?: string[];

  // Yield and storage
  yieldData?: {
    actual: number;
    unit: string;
    inKg: number;
    pricePerUnit: number;
    pricePerKg: number;
    priceUnit: string;
    warnings?: string[];
  };
  storageMethod?: string;

  // Costs
  labourCosts?: {
    ploughing?: number;
    planting?: number;
    weeding?: number;
    harvesting?: number;
  };
  transportCostPerKg?: number;      // NEW - per kg transport cost
  emptyBags?: number;                // NEW - number of empty bags to buy
  bagCost?: number;

  // Challenges
  productionChallenges?: string[];
  marketingChallenges?: string[];
  climateChallenges?: string[];
  financialChallenges?: string[];

  // Conservation (combined)
  conservationPractices?: string[];

  // Lime prices
  limePricePerBag?: number;
  recCalciticLime?: number;

  // Soil test data
  soilTest?: SoilTestResults & {
    plantingFertilizerToUse?: string;
    plantingFertilizerCost?: number;
    topdressingFertilizerToUse?: string;
    topdressingFertilizerCost?: number;
    potassiumFertilizerToUse?: string;
    potassiumFertilizerCost?: number;
    fertilizerPlan?: FertilizerBlendResult;
    perPlant?: PerPlantInfo;
  };

  // Recommendations
  recommendations: string[];
  structuredList: any[];
  financialAdvice: string;
  structuredFinancialAdvice: any;
  grossMarginAnalysis?: GrossMarginOutput;

  // Metadata
  metadata?: {
    warnings: {
      yield?: string[];
      price?: string[];
      spacing?: string[];
    };
    createdAt: string;
    source: string;
    version: string;
  };

  // Legacy fields
  actualYield?: number;
  yieldUnit?: string;
  pricePerUnit?: number;
  queryCount: number;
  createdAt: string;
  source: string;
}

// ========== FERTILIZER DATABASE INTERFACES ==========
export interface FertilizerProduct {
  id: string;
  brand: string;
  company: string;
  type: "planting" | "topdressing" | "potassium" | "lime" | "organic";
  npk: string;
  nutrients: ParsedNutrients;
  crops: string[];
  description?: string;
  packageSizes?: string[];
  pricePer50kg?: number;
  applicationRate?: string;
  timing?: string;
  recommendedFor?: CropCategory[];
}

// ========== CROP INFORMATION INTERFACE ==========
export interface CropInfo {
  name: string;
  category: CropCategory;
  varieties: string[];
  spacingOptions: SpacingInfo[];
  plantingDates: {
    regions: Record<string, { earliest: string; latest: string; optimal: string }>;
    default: { earliest: string; latest: string; optimal: string };
  };
  fertilizerRates: {
    planting: { name: string; rate: number; unit: string; provides: ParsedNutrients }[];
    topdressing: { name: string; rate: number; unit: string; provides: ParsedNutrients }[];
  };
  pests: string[];
  diseases: string[];
  conversionFactors: CropConversionFactors;
  nutrientRequirements: {
    n: number; // kg per ton
    p: number; // kg per ton
    k: number; // kg per ton
  };
}
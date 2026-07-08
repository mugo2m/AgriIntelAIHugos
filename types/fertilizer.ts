// types/fertilizer.ts
// Additional type definitions for fertilizer module

export interface FertilizerSelection {
  plantingIds: string[];
  topDressingIds: string[];
}

export interface FertilizerPrice {
  fertilizerId: string;
  pricePer50kg: number; // Ksh per 50kg bag
  retailer?: string;
  location?: string;
  date: string;
}

export interface FertilizerCalculationInput {
  soilTestData: any;
  cropType: string;
  targetYield: number; // e.g., 40 bags for maize
  plantingFertilizers: string[];
  topDressingFertilizers: string[];
  prices?: Record<string, number>;
}

export interface FertilizerCalculationResult {
  success: boolean;
  result?: FertilizerBlendResult;
  error?: string;
}

export interface FertilizerPackageOption {
  size: string; // e.g., "100ml", "250ml", "500ml", "1L", "5L"
  coverageAcres: number;
  price: number;
  pricePerAcre: number;
}

export interface PesticideRecommendation {
  pestName: string;
  productName: string;
  activeIngredient: string;
  packageOptions: FertilizerPackageOption[];
  applicationRate: string; // e.g., "40ml per 20L water"
  applicationMethod: string;
  timing: string;
  safetyInterval: string; // days before harvest
  culturalControls: string[];
  businessNote: string;
}
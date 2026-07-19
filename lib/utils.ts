// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ===== CN HELPER (used by shadcn/ui components) =====
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ========== PLANT POPULATION & FERTILIZER PER PLANT UTILITIES ==========

export interface SpacingInput {
  rowCm: number;
  plantCm: number;
  seedsPerHole: number;
}

export function calculatePlantsPerAcre(spacing: SpacingInput): number {
  const { rowCm, plantCm, seedsPerHole } = spacing;
  // 1 acre = 4046.86 m² = 40,468,600 cm²
  // Area per plant = rowCm * plantCm (cm²)
  const areaPerPlant = rowCm * plantCm;
  const plantsPerAcre = Math.round((4046.86 * 10000) / areaPerPlant * seedsPerHole);
  return plantsPerAcre;
}

export function calculateTotalPlants(plantsPerAcre: number, acres: number): number {
  return Math.round(plantsPerAcre * acres);
}

export function calculateFertilizerPerPlant(
  dapKg: number,
  ureaKg: number,
  mopKg: number,
  totalPlants: number,
  isPerennial: boolean = false
): { dapGrams: number; ureaGrams: number; mopGrams: number; totalGrams: number } {
  if (totalPlants === 0) return { dapGrams: 0, ureaGrams: 0, mopGrams: 0, totalGrams: 0 };
  // For perennials, split the total over the number of plants (they are spaced wide)
  const factor = isPerennial ? 1 : 1;
  const dapGrams = (dapKg * 1000 * factor) / totalPlants;
  const ureaGrams = (ureaKg * 1000 * factor) / totalPlants;
  const mopGrams = (mopKg * 1000 * factor) / totalPlants;
  const totalGrams = dapGrams + ureaGrams + mopGrams;
  return { dapGrams, ureaGrams, mopGrams, totalGrams };
}

export function getMeasurementGuide(grams: number): string {
  if (grams <= 0) return "0 grams – not needed";
  if (grams < 1) {
    // For very small amounts, use teaspoons (1 teaspoon ≈ 5g)
    const tsp = grams / 5;
    if (tsp < 0.5) return `${(tsp * 1000).toFixed(0)} mg (pinch)`;
    if (tsp < 1) return `${tsp.toFixed(1)} teaspoon`;
    if (tsp < 2) return `${tsp.toFixed(1)} teaspoons`;
    return `${tsp.toFixed(1)} teaspoons`;
  }
  if (grams < 15) {
    const tsp = grams / 5;
    if (tsp < 1) return `${tsp.toFixed(1)} teaspoon`;
    if (tsp < 2) return `${tsp.toFixed(1)} teaspoons`;
    return `${tsp.toFixed(1)} teaspoons (approx ${Math.round(tsp)} tsp)`;
  }
  // For larger amounts, use tablespoons (1 tablespoon ≈ 15g) and cups (1 cup ≈ 240g)
  const tbsp = grams / 15;
  if (tbsp < 4) return `${tbsp.toFixed(1)} tablespoons`;
  const cups = grams / 240;
  if (cups < 1) return `🥄 ${Math.round(tbsp)} tablespoons`;
  if (cups < 2) return `🥛 ${cups.toFixed(1)} cup (about ${Math.round(tbsp)} tbsp)`;
  return `🧴 ${cups.toFixed(1)} cups (${Math.round(tbsp)} tbsp)`;
}
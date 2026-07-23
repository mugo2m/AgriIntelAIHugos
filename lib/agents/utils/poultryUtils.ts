// lib/agents/utils/poultryUtils.ts
import { poultryFeedRequirements, FeedRequirement } from '@/lib/data/poultryFeed';
import { poultryVaccinationSchedules, VaccinationRecord } from '@/lib/data/poultryVaccination';
import { poultryProductionCosts, ProductionCost, calculateTotalCost } from '@/lib/data/poultryProductionCosts';
import { poultryHousingRequirements, HousingRequirement } from '@/lib/data/poultryHousing';
import { poultryQualityStandards, QualityStandard } from '@/lib/data/poultryQualityStandards';
import { poultryBreedTraits, BreedTraits } from '@/lib/data/poultryBreedTraits';
import { poultryBiosecurityChecklist, BiosecurityItem } from '@/lib/data/poultryBiosecurity';
import { poultryHatcheries, Hatchery } from '@/lib/data/poultryHatcheries';

export function getPoultryFeed(species: string, breed: string, ageWeeks: number): FeedRequirement | null {
  const speciesKey = species.toLowerCase();
  const breedData = poultryFeedRequirements[speciesKey]?.[breed];
  if (!breedData) return null;
  let lifeStage = "starter";
  if (ageWeeks > 12) lifeStage = "layer";
  else if (ageWeeks > 6) lifeStage = "grower";
  const matched = breedData.find(req => req.lifeStage.includes(lifeStage));
  return matched || breedData[0] || null;
}

export function getPoultryVaccines(species: string, breed: string): VaccinationRecord[] {
  const speciesKey = species.toLowerCase();
  return poultryVaccinationSchedules[speciesKey]?.[breed] || [];
}

export function getPoultryCosts(species: string, breed: string, system: string): ProductionCost | null {
  const speciesKey = species.toLowerCase();
  const costs = poultryProductionCosts[speciesKey]?.[breed];
  if (!costs) return null;
  const matched = costs.find(c => c.system === system);
  if (matched) matched.totalCostPerBird = calculateTotalCost(matched);
  return matched || costs[0] || null;
}

export function getPoultryHousing(species: string, breed: string, system: string): HousingRequirement | null {
  const speciesKey = species.toLowerCase();
  const housing = poultryHousingRequirements[speciesKey]?.[breed];
  if (!housing) return null;
  return housing.find(h => h.systemType === system) || housing[0] || null;
}

export function getPoultryQuality(species: string, breed: string): QualityStandard | null {
  const speciesKey = species.toLowerCase();
  const quality = poultryQualityStandards[speciesKey]?.[breed];
  return quality ? quality[0] : null;
}

export function getPoultryTraits(species: string, breed: string): BreedTraits | null {
  const speciesKey = species.toLowerCase();
  return poultryBreedTraits[speciesKey]?.[breed] || null;
}

export function getBiosecurityItems(category?: string): BiosecurityItem[] {
  return category ? poultryBiosecurityChecklist.filter(item => item.category === category) : poultryBiosecurityChecklist;
}

export function getHatcheriesByCountry(country: string): Hatchery[] {
  return poultryHatcheries.filter(h => h.country.toLowerCase() === country.toLowerCase());
}

export function getHatcheriesByCounty(county: string): Hatchery[] {
  return poultryHatcheries.filter(h => h.county.toLowerCase().includes(county.toLowerCase()));
}
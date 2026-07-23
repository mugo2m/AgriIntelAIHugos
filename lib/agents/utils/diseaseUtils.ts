// lib/agents/utils/diseaseUtils.ts
import { cropPestDiseaseMap } from "@/lib/data/pestDiseaseMapping";

export function getDiseaseOptionsForCrop(cropKey: string): string[] {
  const entries = cropPestDiseaseMap[cropKey] || [];
  const diseaseEntries = entries.filter((item) => item.type === "disease");
  if (diseaseEntries.length === 0) {
    return ["Other"]; // Fallback
  }
  return diseaseEntries.map((item) => item.name);
}
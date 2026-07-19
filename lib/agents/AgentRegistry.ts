// lib/agents/AgentRegistry.ts
import { EnterpriseSetupAgent } from "./EnterpriseSetupAgent";
import { FertilizerInterviewAgent } from "./FertilizerInterviewAgent";
import { PestInterviewAgent } from "./PestInterviewAgent";
import { DiseaseInterviewAgent } from "./DiseaseInterviewAgent";
import { NutrientInterviewAgent } from "./NutrientInterviewAgent";
import { GrossMarginInterviewAgent } from "./GrossMarginInterviewAgent";
import { StorageInterviewAgent } from "./StorageInterviewAgent";
import { ConservationInterviewAgent } from "./ConservationInterviewAgent";
import { GAPInterviewAgent } from "./GAPInterviewAgent";
import { InterviewAgentConstructor } from "./AgentTypes";

export const AgentRegistry: InterviewAgentConstructor[] = [
  EnterpriseSetupAgent,
  FertilizerInterviewAgent,
  PestInterviewAgent,
  DiseaseInterviewAgent,
  NutrientInterviewAgent,
  GrossMarginInterviewAgent,
  StorageInterviewAgent,
  ConservationInterviewAgent,
  GAPInterviewAgent,
];

export const AgentNames = [
  "Enterprise Setup",
  "Fertilizer Management",
  "Pest Management",
  "Disease Management",
  "Nutrient Management",
  "Gross Margin",
  "Storage",
  "Conservation",
  "Good Agricultural Practices",
];

export function getAgentName(index: number): string {
  return AgentNames[index] || `Agent ${index + 1}`;
}

export function getTotalAgents(): number {
  return AgentRegistry.length;
}
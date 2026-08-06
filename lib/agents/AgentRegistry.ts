// lib/agents/agentRegistry.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";
import EnterpriseSetupAgent from "./EnterpriseSetupAgent";
import { DiseaseInterviewAgent } from "./DiseaseInterviewAgent";      // <-- FIXED: named import

// Poultry agents
import PoultrySetupAgent from "./PoultrySetupAgent";
import { PoultryDiseaseAgent } from "./PoultryDiseaseAgent";          // <-- FIXED: named import

// Dairy agents (core)
import { DairySetupAgent } from "./DairySetupAgent";
import { DairyHealthAgent } from "./DairyHealthAgent";

// Dairy agents (all new modules)
import { DairyBreedingAgent } from "./DairyBreedingAgent";
import { DairyBusinessAgent } from "./DairyBusinessAgent";
import { DairyCalfAgent } from "./DairyCalfAgent";
import { DairyConcentrateAgent } from "./DairyConcentrateAgent";
import { DairyDeficiencyAgent } from "./DairyDeficiencyAgent";
import { DairyDosDontsAgent } from "./DairyDosDontsAgent";
import { DairyFeedAgent } from "./DairyFeedAgent";
import { DairyFeedPerDayAgent } from "./DairyFeedPerDayAgent";
import { DairyFinancialAgent } from "./DairyFinancialAgent";
import { DairyHousingAgent } from "./DairyHousingAgent";
import { DairyMilkAgent } from "./DairyMilkAgent";
import { DairyParasiteAgent } from "./DairyParasiteAgent";
import { DairyReminderAgent } from "./DairyReminderAgent";

// NEW: Crop agents (GAP, Profit, Business Plan)
import { GAPAgent } from "./GAPAgent";
import { ProfitCalculationAgent } from "./ProfitCalculationAgent";
import { BusinessPlanAgent } from "./BusinessPlanAgent";

// NEW: Poultry and Dairy Business Plan agents
import { PoultryBusinessPlanAgent } from "./PoultryBusinessPlanAgent";
import { DairyBusinessPlanAgent } from "./DairyBusinessPlanAgent";

// Map agent names to instances
const agentMap: Record<string, BaseInterviewAgent> = {
  // Crop agents
  EnterpriseSetupAgent: new EnterpriseSetupAgent(),
  DiseaseInterviewAgent: new DiseaseInterviewAgent(),

  // Poultry agents
  PoultrySetupAgent: new PoultrySetupAgent(),
  PoultryDiseaseAgent: new PoultryDiseaseAgent(),

  // Dairy agents
  DairySetupAgent: new DairySetupAgent(),
  DairyHealthAgent: new DairyHealthAgent(),
  DairyBreedingAgent: new DairyBreedingAgent(),
  DairyBusinessAgent: new DairyBusinessAgent(),
  DairyCalfAgent: new DairyCalfAgent(),
  DairyConcentrateAgent: new DairyConcentrateAgent(),
  DairyDeficiencyAgent: new DairyDeficiencyAgent(),
  DairyDosDontsAgent: new DairyDosDontsAgent(),
  DairyFeedAgent: new DairyFeedAgent(),
  DairyFeedPerDayAgent: new DairyFeedPerDayAgent(),
  DairyFinancialAgent: new DairyFinancialAgent(),
  DairyHousingAgent: new DairyHousingAgent(),
  DairyMilkAgent: new DairyMilkAgent(),
  DairyParasiteAgent: new DairyParasiteAgent(),
  DairyReminderAgent: new DairyReminderAgent(),

  // NEW: Crop recommendation agents
  GAPAgent: new GAPAgent(),
  ProfitCalculationAgent: new ProfitCalculationAgent(),
  BusinessPlanAgent: new BusinessPlanAgent(),

  // NEW: Poultry and Dairy Business Plan agents
  PoultryBusinessPlanAgent: new PoultryBusinessPlanAgent(),
  DairyBusinessPlanAgent: new DairyBusinessPlanAgent(),
};

/**
 * Get all questions for a list of agent names, deduplicated by question id.
 * Automatically includes EnterpriseSetupAgent if not already present.
 */
export function getQuestionsForAgents(
  agentNames: string[],
  context: FarmerContext
): InterviewQuestion[] {
  let allQuestions: InterviewQuestion[] = [];

  // Always include EnterpriseSetupAgent first to get core farmer details
  const finalAgentNames = agentNames.includes("EnterpriseSetupAgent")
    ? agentNames
    : ["EnterpriseSetupAgent", ...agentNames];

  for (const name of finalAgentNames) {
    const agent = agentMap[name];
    if (agent && typeof agent.getQuestions === "function") {
      try {
        const questions = agent.getQuestions(context);
        if (Array.isArray(questions)) {
          allQuestions = allQuestions.concat(questions);
        } else {
          console.warn(`Agent "${name}" returned non-array questions.`);
        }
      } catch (error) {
        console.error(`Error getting questions from agent "${name}":`, error);
      }
    } else {
      console.warn(`Agent "${name}" not found in agentMap.`);
    }
  }

  // Deduplicate by `id` (keep first occurrence)
  const seen = new Set<string>();
  return allQuestions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

// Optional: expose the agent map for debugging or dynamic lookup
export { agentMap };
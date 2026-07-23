// lib/agents/agentRegistry.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";
import EnterpriseSetupAgent from "./EnterpriseSetupAgent";
import DiseaseInterviewAgent from "./DiseaseInterviewAgent";

const agentMap: Record<string, BaseInterviewAgent> = {
  EnterpriseSetupAgent: new EnterpriseSetupAgent(),
  DiseaseInterviewAgent: new DiseaseInterviewAgent(),
  // Add other agents here when ready
};

export function getQuestionsForAgents(
  agentNames: string[],
  context: FarmerContext
): InterviewQuestion[] {
  let allQuestions: InterviewQuestion[] = [];

  const finalAgentNames = agentNames.includes("EnterpriseSetupAgent")
    ? agentNames
    : ["EnterpriseSetupAgent", ...agentNames];

  for (const name of finalAgentNames) {
    const agent = agentMap[name];
    if (agent && typeof agent.getQuestions === "function") {
      allQuestions = allQuestions.concat(agent.getQuestions(context));
    } else {
      console.warn(`Agent "${name}" not found or invalid.`);
    }
  }

  const seen = new Set<string>();
  return allQuestions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}
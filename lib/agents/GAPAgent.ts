import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class GAPAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "GAPAgent";
  }

  // No additional questions – GAP advice is based on the crop already collected
  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [];
  }
}
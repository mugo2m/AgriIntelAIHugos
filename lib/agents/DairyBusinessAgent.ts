// lib/agents/DairyBusinessAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const BUSINESS_INTERESTS = ["bulk_buying", "cooperative", "value_addition", "scaling", "cost_reduction"];

export class DairyBusinessAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyBusinessAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyBusinessInterest",
        type: "multiselect",
        questionKey: "question_dairy_business_interest",
        options: BUSINESS_INTERESTS,
        sectionKey: "section_dairy_business",
      },
    ];
  }
}
// lib/agents/DairyFinancialAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class DairyFinancialAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyFinancialAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyFeedCostPerDay",
        type: "number",
        questionKey: "question_dairy_feed_cost_per_day",
        placeholder: "e.g., 150",
        step: "any",
        sectionKey: "section_dairy_finance",
      },
      {
        id: "dairyMilkPrice",
        type: "number",
        questionKey: "question_dairy_milk_price",
        placeholder: "e.g., 50",
        step: "any",
        sectionKey: "section_dairy_finance",
      },
      {
        id: "dairyVetCostMonth",
        type: "number",
        questionKey: "question_dairy_vet_cost_month",
        placeholder: "e.g., 2000",
        step: "any",
        sectionKey: "section_dairy_finance",
      },
      {
        id: "dairyOtherCosts",
        type: "number",
        questionKey: "question_dairy_other_costs",
        placeholder: "e.g., 3000",
        step: "any",
        sectionKey: "section_dairy_finance",
      },
    ];
  }
}
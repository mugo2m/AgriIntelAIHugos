// lib/agents/DairyFinancialAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyFinancialAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyFeedCostPerDay",
        type: "number",
        label: "What is your total feed cost per cow per day?",
        placeholder: "e.g., 150",
        required: true,
      },
      {
        id: "dairyMilkPrice",
        type: "number",
        label: "What is the sale price per litre of milk?",
        placeholder: "e.g., 50",
        required: true,
      },
      {
        id: "dairyVetCostMonth",
        type: "number",
        label: "What is your total veterinary cost per month?",
        placeholder: "e.g., 2000",
        required: false,
      },
      {
        id: "dairyOtherCosts",
        type: "number",
        label: "Other monthly costs (labour, water, transport, etc.)?",
        placeholder: "e.g., 3000",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyFinancial",
      collectedData: this.answers,
      message: "Dairy financial details collected.",
    };
  }
}
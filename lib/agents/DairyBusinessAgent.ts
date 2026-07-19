// lib/agents/DairyBusinessAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyBusinessAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyBusinessInterest",
        type: "multiselect",
        label: "Which business topics interest you?",
        options: [
          { value: "bulk_buying", label: "Bulk buying of inputs" },
          { value: "cooperative", label: "Cooperative / group marketing" },
          { value: "value_addition", label: "Value addition (yoghurt, cheese)" },
          { value: "scaling", label: "Scaling up the herd" },
          { value: "cost_reduction", label: "Cost reduction strategies" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyBusiness",
      collectedData: this.answers,
      message: "Dairy business interests collected.",
    };
  }
}
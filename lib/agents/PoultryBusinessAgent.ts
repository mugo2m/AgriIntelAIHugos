// lib/agents/PoultryBusinessAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryBusinessAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "businessInterest",
        type: "multiselect",
        label: "Which business topics interest you?",
        options: [
          { value: "bulk_buying", label: "Bulk buying of inputs" },
          { value: "group_marketing", label: "Group marketing / cooperatives" },
          { value: "value_addition", label: "Value addition (processing)" },
          { value: "scaling", label: "Scaling up your enterprise" },
          { value: "cost_reduction", label: "Cost reduction strategies" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryBusiness",
      collectedData: this.answers,
      message: "Business interests collected.",
    };
  }
}
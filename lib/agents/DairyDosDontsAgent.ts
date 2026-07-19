// lib/agents/DairyDosDontsAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyDosDontsAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyManagementFocus",
        type: "multiselect",
        label: "Which areas would you like dos and don'ts for?",
        options: [
          { value: "calf_rearing", label: "Calf rearing" },
          { value: "feeding", label: "Feeding" },
          { value: "housing", label: "Housing" },
          { value: "milking", label: "Milking" },
          { value: "health", label: "Health" },
          { value: "breeding", label: "Breeding" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyDosDonts",
      collectedData: this.answers,
      message: "Dairy Dos and Don'ts selection collected.",
    };
  }
}
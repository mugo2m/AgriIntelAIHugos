// lib/agents/PoultryDosDontsAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryDosDontsAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "managementFocus",
        type: "multiselect",
        label: "Which areas of poultry management would you like dos and don'ts for?",
        options: [
          { value: "brooding", label: "Brooding" },
          { value: "feeding", label: "Feeding" },
          { value: "housing", label: "Housing" },
          { value: "health", label: "Health" },
          { value: "financial", label: "Financial" },
          { value: "record_keeping", label: "Record keeping" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryDosDonts",
      collectedData: this.answers,
      message: "Dos and Don'ts selection collected.",
    };
  }
}
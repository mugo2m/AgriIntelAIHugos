// lib/agents/DairySetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairySetupAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "cowCategory",
        type: "select",
        label: "What category is this cow?",
        options: [
          { value: "lactating", label: "Lactating cow" },
          { value: "dry", label: "Dry cow" },
          { value: "heifer", label: "Heifer" },
          { value: "calf", label: "Calf" },
        ],
        required: true,
      },
      {
        id: "bodyWeightKg",
        type: "number",
        label: "What is the average body weight in kilograms?",
        placeholder: "e.g., 500",
        required: true,
      },
      {
        id: "breedDairy",
        type: "select",
        label: "Which breed is this cow?",
        options: [
          { value: "fh", label: "Friesian (Holstein)" },
          { value: "ayrshire", label: "Ayrshire" },
          { value: "jersey", label: "Jersey" },
          { value: "guernsey", label: "Guernsey" },
          { value: "sahiwal", label: "Sahiwal" },
          { value: "zebu", label: "Zebu" },
          { value: "cross", label: "Crossbreed" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairySetup",
      collectedData: this.answers,
      message: "Dairy setup details collected.",
    };
  }
}
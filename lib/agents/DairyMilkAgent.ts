// lib/agents/DairyMilkAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyMilkAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "milkYieldCurrent",
        type: "number",
        label: "What is the current milk yield per cow per day (litres)?",
        placeholder: "e.g., 15",
        required: true,
      },
      {
        id: "milkFatPercent",
        type: "number",
        label: "What is the milk fat percentage?",
        placeholder: "e.g., 4.0",
        required: false,
      },
      {
        id: "milkProteinPercent",
        type: "number",
        label: "What is the milk protein percentage?",
        placeholder: "e.g., 3.2",
        required: false,
      },
      {
        id: "daysInMilk",
        type: "number",
        label: "How many days in milk (DIM)?",
        placeholder: "e.g., 120",
        required: true,
      },
      {
        id: "parity",
        type: "select",
        label: "What is the parity (lactation number) of the cow?",
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4+", label: "4+" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyMilk",
      collectedData: this.answers,
      message: "Milk production details collected.",
    };
  }
}
// lib/agents/PoultryFeedPerDayAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryFeedPerDayAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "feedTypeUsed",
        type: "select",
        label: "What feed type do you currently use?",
        options: [
          { value: "commercial", label: "Commercial feed" },
          { value: "home_mixed", label: "Home‑mixed feed" },
        ],
        required: true,
      },
      {
        id: "feedCostPerKg",
        type: "number",
        label: "What is the cost of 1 kg of feed?",
        placeholder: "e.g., 45",
        required: false,
      },
      {
        id: "dailyFeedPerBird",
        type: "number",
        label: "How many grams of feed does each bird consume per day?",
        placeholder: "e.g., 120",
        required: false,
      },
      {
        id: "feedWasteEstimate",
        type: "select",
        label: "How much feed do you estimate is wasted daily?",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryFeedPerDay",
      collectedData: this.answers,
      message: "Feed per day details collected.",
    };
  }
}
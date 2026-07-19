// lib/agents/DairyFeedPerDayAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyFeedPerDayAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyForageType",
        type: "select",
        label: "What type of forage do you feed?",
        options: [
          { value: "napier_grass", label: "Napier grass" },
          { value: "rhodes_hay", label: "Rhodes hay" },
          { value: "lucerne_hay", label: "Lucerne hay" },
          { value: "maize_silage", label: "Maize silage" },
          { value: "oat_hay", label: "Oat hay" },
          { value: "desmodium", label: "Desmodium" },
        ],
        required: true,
      },
      {
        id: "dairyForageKgPerDay",
        type: "number",
        label: "How many kilograms of forage do you feed per cow per day?",
        placeholder: "e.g., 30",
        required: true,
      },
      {
        id: "dairyConcentrateType",
        type: "select",
        label: "What type of concentrate do you feed?",
        options: [
          { value: "commercial_dairy", label: "Commercial dairy concentrate" },
          { value: "home_mix", label: "Home‑mixed concentrate" },
          { value: "none", label: "None" },
        ],
        required: true,
      },
      {
        id: "dairyConcentrateKgPerDay",
        type: "number",
        label: "How many kilograms of concentrate per cow per day?",
        placeholder: "e.g., 4",
        required: false,
      },
      {
        id: "dairyMilkYield",
        type: "number",
        label: "What is the current milk yield per cow per day (litres)?",
        placeholder: "e.g., 15",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyFeedPerDay",
      collectedData: this.answers,
      message: "Daily feed details collected.",
    };
  }
}
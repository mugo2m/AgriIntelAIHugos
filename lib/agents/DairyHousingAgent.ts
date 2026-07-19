// lib/agents/DairyHousingAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyHousingAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyHousingType",
        type: "select",
        label: "What type of housing do you have?",
        options: [
          { value: "zero_grazing", label: "Zero‑grazing" },
          { value: "free_stall", label: "Free‑stall" },
          { value: "tie_stall", label: "Tie‑stall" },
          { value: "pasture_shelter", label: "Pasture with shelter" },
        ],
        required: true,
      },
      {
        id: "numberOfCowsHoused",
        type: "number",
        label: "How many cows are housed?",
        placeholder: "e.g., 10",
        required: true,
      },
      {
        id: "floorSpacePerCowM2",
        type: "number",
        label: "What is the floor space per cow in square metres?",
        placeholder: "e.g., 4",
        required: false,
      },
      {
        id: "dairyVentilationRating",
        type: "select",
        label: "How is the ventilation in your housing?",
        options: [
          { value: "good", label: "Good" },
          { value: "average", label: "Average" },
          { value: "poor", label: "Poor" },
        ],
        required: true,
      },
      {
        id: "beddingType",
        type: "select",
        label: "What type of bedding do you use?",
        options: [
          { value: "straw", label: "Straw" },
          { value: "sand", label: "Sand" },
          { value: "sawdust", label: "Sawdust" },
          { value: "none", label: "None" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyHousing",
      collectedData: this.answers,
      message: "Dairy housing details collected.",
    };
  }
}
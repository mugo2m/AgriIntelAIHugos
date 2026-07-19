// lib/agents/PoultryHousingAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryHousingAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "housingType",
        type: "select",
        label: "What type of housing system do you use?",
        options: [
          { value: "deep_litter", label: "Deep litter" },
          { value: "battery_cage", label: "Battery cage" },
          { value: "free_range", label: "Free range" },
          { value: "slatted_floor", label: "Slatted floor" },
        ],
        required: true,
      },
      {
        id: "floorSpaceM2",
        type: "number",
        label: "How many square metres of floor space does your house have?",
        placeholder: "e.g., 50",
        required: false,
      },
      {
        id: "ventilationRating",
        type: "select",
        label: "How would you rate the ventilation in your house?",
        options: [
          { value: "good", label: "Good" },
          { value: "average", label: "Average" },
          { value: "poor", label: "Poor" },
        ],
        required: true,
      },
      {
        id: "roofType",
        type: "select",
        label: "What type of roof do you have?",
        options: [
          { value: "iron_sheets", label: "Iron sheets" },
          { value: "thatch", label: "Thatch" },
          { value: "tiles", label: "Tiles" },
          { value: "concrete", label: "Concrete" },
        ],
        required: false,
      },
      {
        id: "drainageRating",
        type: "select",
        label: "How is the drainage around your house?",
        options: [
          { value: "good", label: "Good" },
          { value: "poor", label: "Poor" },
        ],
        required: true,
      },
      {
        id: "predatorRisk",
        type: "select",
        label: "How high is the predator risk in your area?",
        options: [
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryHousing",
      collectedData: this.answers,
      message: "Housing details collected.",
    };
  }
}
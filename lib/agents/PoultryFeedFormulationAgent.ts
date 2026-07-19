// lib/agents/PoultryFeedFormulationAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryFeedFormulationAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "stage",
        type: "select",
        label: "What stage are your birds at?",
        options: [
          { value: "starter", label: "Starter (0–4 weeks)" },
          { value: "grower", label: "Grower (4–8 weeks)" },
          { value: "layer", label: "Layer (18+ weeks)" },
          { value: "finisher", label: "Finisher (broilers – 4+ weeks)" },
        ],
        required: true,
      },
      {
        id: "quantityKg",
        type: "number",
        label: "How many kilograms of feed do you want to mix?",
        placeholder: "e.g., 100",
        required: true,
      },
      {
        id: "includeCoccidiostat",
        type: "boolean",
        label: "Do you want to include a coccidiostat in the feed?",
        required: true,
      },
      {
        id: "availableIngredients",
        type: "multiselect",
        label: "Which ingredients do you have available?",
        options: [
          { value: "maize", label: "Maize" },
          { value: "soya_bean_meal", label: "Soya bean meal" },
          { value: "fishmeal", label: "Fishmeal" },
          { value: "omena", label: "Omena" },
          { value: "sunflower_cake", label: "Sunflower cake" },
          { value: "wheat_bran", label: "Wheat bran" },
          { value: "lime", label: "Lime" },
          { value: "dcp", label: "DCP" },
          { value: "premix", label: "Premix" },
          { value: "methionine", label: "Methionine" },
          { value: "lysine", label: "Lysine" },
          { value: "salt", label: "Salt" },
          { value: "toxin_binder", label: "Toxin binder" },
        ],
        required: false,
      },
      {
        id: "useCustomPrices",
        type: "boolean",
        label: "Do you want to enter your own local prices?",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryFeedFormulation",
      collectedData: this.answers,
      message: "Feed formulation details collected.",
    };
  }
}
// lib/agents/DairyFeedAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyFeedAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyAvailableForages",
        type: "multiselect",
        label: "Which forages do you have available?",
        options: [
          { value: "napier_grass", label: "Napier grass" },
          { value: "rhodes_hay", label: "Rhodes hay" },
          { value: "lucerne_hay", label: "Lucerne hay" },
          { value: "maize_silage", label: "Maize silage" },
          { value: "oat_hay", label: "Oat hay" },
          { value: "desmodium", label: "Desmodium" },
          { value: "banana_leaves", label: "Banana leaves" },
          { value: "maize_stover", label: "Maize stover" },
        ],
        required: true,
      },
      {
        id: "dairyAvailableGrains",
        type: "multiselect",
        label: "Which grains or energy sources do you have?",
        options: [
          { value: "maize", label: "Maize" },
          { value: "sorghum", label: "Sorghum" },
          { value: "millet", label: "Millet" },
          { value: "wheat_bran", label: "Wheat bran" },
          { value: "pollard", label: "Pollard" },
          { value: "rice_bran", label: "Rice bran" },
          { value: "molasses", label: "Molasses" },
        ],
        required: false,
      },
      {
        id: "dairyAvailableProtein",
        type: "multiselect",
        label: "Which protein sources do you have?",
        options: [
          { value: "soybean_meal", label: "Soybean meal" },
          { value: "sunflower_cake", label: "Sunflower cake" },
          { value: "cottonseed_cake", label: "Cottonseed cake" },
          { value: "groundnut_cake", label: "Groundnut cake" },
          { value: "canola_meal", label: "Canola meal" },
          { value: "fishmeal", label: "Fishmeal" },
        ],
        required: false,
      },
      {
        id: "dairyAvailableMinerals",
        type: "multiselect",
        label: "Which minerals and additives do you have?",
        options: [
          { value: "salt", label: "Salt" },
          { value: "limestone", label: "Limestone flour" },
          { value: "dcp", label: "DCP" },
          { value: "magnesium_oxide", label: "Magnesium oxide" },
          { value: "dairy_premix", label: "Dairy premix" },
          { value: "sodium_bicarbonate", label: "Sodium bicarbonate" },
        ],
        required: false,
      },
      {
        id: "dairyQuantityToMix",
        type: "number",
        label: "How many kilograms of total mixed ration do you want to mix per day?",
        placeholder: "e.g., 40",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyFeed",
      collectedData: this.answers,
      message: "Dairy feed formulation details collected.",
    };
  }
}
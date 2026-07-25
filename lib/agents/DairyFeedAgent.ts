// lib/agents/DairyFeedAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const FORAGES = ["napier_grass", "rhodes_hay", "lucerne_hay", "maize_silage", "oat_hay", "desmodium", "banana_leaves", "maize_stover"];
const GRAINS = ["maize", "sorghum", "millet", "wheat_bran", "pollard", "rice_bran", "molasses"];
const PROTEINS = ["soybean_meal", "sunflower_cake", "cottonseed_cake", "groundnut_cake", "canola_meal", "fishmeal"];
const MINERALS = ["salt", "limestone", "dcp", "magnesium_oxide", "dairy_premix", "sodium_bicarbonate"];

export class DairyFeedAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyFeedAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyAvailableForages",
        type: "multiselect",
        questionKey: "question_dairy_available_forages",
        options: FORAGES,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyAvailableGrains",
        type: "multiselect",
        questionKey: "question_dairy_available_grains",
        options: GRAINS,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyAvailableProtein",
        type: "multiselect",
        questionKey: "question_dairy_available_protein",
        options: PROTEINS,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyAvailableMinerals",
        type: "multiselect",
        questionKey: "question_dairy_available_minerals",
        options: MINERALS,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyQuantityToMix",
        type: "number",
        questionKey: "question_dairy_quantity_to_mix",
        placeholder: "e.g., 40",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
    ];
  }
}
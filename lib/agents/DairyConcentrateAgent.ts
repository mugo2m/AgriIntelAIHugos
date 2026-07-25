// lib/agents/DairyConcentrateAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const CONCENTRATE_BRANDS = ["koudijs", "unga", "afrimach", "jubaili", "farmers_choice", "royal_dutch", "hendrix", "intraco", "cargill"];
const CONCENTRATE_PRODUCTS = ["16pc", "18pc", "layer", "dairy_meal"];
const CALCIUM_SOURCES = ["limestone", "dcp", "oyster_shell", "none"];

export class DairyConcentrateAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyConcentrateAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyConcentrateBrand",
        type: "dropdown",
        questionKey: "question_dairy_concentrate_brand",
        options: CONCENTRATE_BRANDS,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateProduct",
        type: "dropdown",
        questionKey: "question_dairy_concentrate_product",
        options: CONCENTRATE_PRODUCTS,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateInclusion",
        type: "number",
        questionKey: "question_dairy_concentrate_inclusion",
        placeholder: "e.g., 3",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateMaizeKg",
        type: "number",
        questionKey: "question_dairy_concentrate_maize_kg",
        placeholder: "e.g., 2",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateSaltKg",
        type: "number",
        questionKey: "question_dairy_concentrate_salt_kg",
        placeholder: "e.g., 0.05",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateCalciumSource",
        type: "dropdown",
        questionKey: "question_dairy_concentrate_calcium_source",
        options: CALCIUM_SOURCES,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateCalciumKg",
        type: "number",
        questionKey: "question_dairy_concentrate_calcium_kg",
        placeholder: "e.g., 0.1",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
    ];
  }
}
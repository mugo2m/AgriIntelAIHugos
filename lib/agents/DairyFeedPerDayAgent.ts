// lib/agents/DairyFeedPerDayAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const FORAGE_TYPES = ["napier_grass", "rhodes_hay", "lucerne_hay", "maize_silage", "oat_hay", "desmodium"];
const CONCENTRATE_TYPES = ["commercial_dairy", "home_mix", "none"];

export class DairyFeedPerDayAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyFeedPerDayAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyForageType",
        type: "dropdown",
        questionKey: "question_dairy_forage_type",
        options: FORAGE_TYPES,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyForageKgPerDay",
        type: "number",
        questionKey: "question_dairy_forage_kg_per_day",
        placeholder: "e.g., 30",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateType",
        type: "dropdown",
        questionKey: "question_dairy_concentrate_type",
        options: CONCENTRATE_TYPES,
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyConcentrateKgPerDay",
        type: "number",
        questionKey: "question_dairy_concentrate_kg_per_day",
        placeholder: "e.g., 4",
        step: "any",
        sectionKey: "section_dairy_feed",
      },
      {
        id: "dairyMilkYield",
        type: "number",
        questionKey: "question_dairy_milk_yield",
        placeholder: "e.g., 15",
        step: "any",
        sectionKey: "section_dairy_production",
      },
    ];
  }
}
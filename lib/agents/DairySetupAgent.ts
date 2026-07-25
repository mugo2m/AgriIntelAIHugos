// lib/agents/DairySetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const DAIRY_CATEGORIES = ["lactating", "dry", "heifer", "calf"];
const DAIRY_BREEDS = ["fh", "ayrshire", "jersey", "guernsey", "sahiwal", "zebu", "cross"];

export class DairySetupAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairySetupAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      // Core details
      {
        id: "dairyCowCategory",
        type: "dropdown",
        questionKey: "question_dairy_cow_category",
        options: DAIRY_CATEGORIES,
        sectionKey: "section_dairy",
      },
      {
        id: "dairyBodyWeightKg",
        type: "number",
        questionKey: "question_dairy_body_weight_kg",
        placeholder: "e.g., 500",
        step: "any",
        sectionKey: "section_dairy",
      },
      {
        id: "dairyBreed",
        type: "dropdown",
        questionKey: "question_dairy_breed",
        options: DAIRY_BREEDS,
        sectionKey: "section_dairy",
      },
      // Financial / production
      {
        id: "dairyMilkYieldPerDay",
        type: "number",
        questionKey: "question_dairy_milk_yield_per_day",
        placeholder: "e.g., 10",
        step: "any",
        sectionKey: "section_dairy",
      },
      {
        id: "dairyMilkPricePerLitre",
        type: "number",
        questionKey: "question_dairy_milk_price_per_litre",
        placeholder: "e.g., 40",
        step: "any",
        sectionKey: "section_dairy",
      },
      {
        id: "dairyFeedCostPerDay",
        type: "number",
        questionKey: "question_dairy_feed_cost_per_day",
        placeholder: "e.g., 100",
        step: "any",
        sectionKey: "section_dairy",
      },
      {
        id: "dairyVetCostPerMonth",
        type: "number",
        questionKey: "question_dairy_vet_cost_per_month",
        placeholder: "e.g., 500",
        step: "any",
        sectionKey: "section_dairy",
      },
    ];
  }
}
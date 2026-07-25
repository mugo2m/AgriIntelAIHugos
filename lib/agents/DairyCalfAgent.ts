// lib/agents/DairyCalfAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const CALF_FEEDING_METHODS = ["bucket", "bottle", "dam", "other"];
const CALF_HOUSING_TYPES = ["individual_pen", "group_pen", "tether", "other"];
const CALF_HEALTH_ISSUES = ["diarrhoea", "cough", "dullness", "naval_infection", "none"];

export class DairyCalfAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyCalfAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "calfAgeWeeks",
        type: "number",
        questionKey: "question_dairy_calf_age_weeks",
        placeholder: "e.g., 4",
        step: "any",
        sectionKey: "section_dairy_calf",
      },
      {
        id: "calfFeedingMethod",
        type: "dropdown",
        questionKey: "question_dairy_calf_feeding_method",
        options: CALF_FEEDING_METHODS,
        sectionKey: "section_dairy_calf",
      },
      {
        id: "calfMilkLitresPerDay",
        type: "number",
        questionKey: "question_dairy_calf_milk_litres_per_day",
        placeholder: "e.g., 6",
        step: "any",
        sectionKey: "section_dairy_calf",
      },
      {
        id: "calfReceivedColostrum",
        type: "dropdown",
        questionKey: "question_dairy_calf_received_colostrum",
        options: ["yes", "no"],
        sectionKey: "section_dairy_calf",
      },
      {
        id: "calfHousingType",
        type: "dropdown",
        questionKey: "question_dairy_calf_housing_type",
        options: CALF_HOUSING_TYPES,
        sectionKey: "section_dairy_calf",
      },
      {
        id: "calfHealthIssues",
        type: "multiselect",
        questionKey: "question_dairy_calf_health_issues",
        options: CALF_HEALTH_ISSUES,
        sectionKey: "section_dairy_calf",
      },
    ];
  }
}
// lib/agents/DairyHealthAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const DAIRY_SYMPTOMS = [
  "swollen_udder",
  "milk_changes",
  "recumbent",
  "fever",
  "coughing",
  "diarrhoea",
  "lameness",
  "bloat",
  "ketosis",
  "abortion",
];

const DAIRY_DURATION = [
  "less_than_3_days",
  "3_to_7_days",
  "more_than_1_week",
];

export class DairyHealthAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyHealthAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairySymptoms",
        type: "multiselect",
        questionKey: "question_dairy_symptoms",
        options: DAIRY_SYMPTOMS,
        sectionKey: "section_dairy",
      },
      {
        id: "dairyMortalityCount",
        type: "number",
        questionKey: "question_dairy_mortality_count",
        placeholder: "e.g., 1",
        step: "any",
        sectionKey: "section_dairy",
      },
      {
        id: "dairyHealthDuration",
        type: "dropdown",
        questionKey: "question_dairy_health_duration",
        options: DAIRY_DURATION,
        sectionKey: "section_dairy",
      },
    ];
  }
}
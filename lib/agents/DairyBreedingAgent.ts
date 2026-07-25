// lib/agents/DairyBreedingAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const BREEDING_METHODS = ["ai", "bull", "both"];
const REPRODUCTIVE_PROBLEMS = ["repeat_breeding", "abortion", "retained_placenta", "none"];

export class DairyBreedingAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyBreedingAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "daysSinceCalving",
        type: "number",
        questionKey: "question_dairy_days_since_calving",
        placeholder: "e.g., 60",
        step: "any",
        sectionKey: "section_dairy_breeding",
      },
      {
        id: "heatObserved",
        type: "dropdown",
        questionKey: "question_dairy_heat_observed",
        options: ["yes", "no"],
        sectionKey: "section_dairy_breeding",
      },
      {
        id: "lastInseminationDate",
        type: "date",
        questionKey: "question_dairy_last_insemination_date",
        sectionKey: "section_dairy_breeding",
      },
      {
        id: "breedingMethod",
        type: "dropdown",
        questionKey: "question_dairy_breeding_method",
        options: BREEDING_METHODS,
        sectionKey: "section_dairy_breeding",
      },
      {
        id: "reproductiveProblems",
        type: "multiselect",
        questionKey: "question_dairy_reproductive_problems",
        options: REPRODUCTIVE_PROBLEMS,
        sectionKey: "section_dairy_breeding",
      },
    ];
  }
}
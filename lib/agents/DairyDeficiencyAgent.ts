// lib/agents/DairyDeficiencyAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const DEFICIENCY_SYMPTOMS = [
  "stiff_gait",
  "poor_appetite",
  "rough_coat",
  "muscle_tremors",
  "scours",
  "nervous_signs",
  "reduced_milk_fat",
  "anaemia",
  "leg_weakness",
  "reproductive_problems",
];

export class DairyDeficiencyAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyDeficiencyAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyDeficiencySymptoms",
        type: "multiselect",
        questionKey: "question_dairy_deficiency_symptoms",
        options: DEFICIENCY_SYMPTOMS,
        sectionKey: "section_dairy_nutrition",
      },
    ];
  }
}
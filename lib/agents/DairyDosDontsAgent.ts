// lib/agents/DairyDosDontsAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const MANAGEMENT_AREAS = ["calf_rearing", "feeding", "housing", "milking", "health", "breeding"];

export class DairyDosDontsAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyDosDontsAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyManagementFocus",
        type: "multiselect",
        questionKey: "question_dairy_management_focus",
        options: MANAGEMENT_AREAS,
        sectionKey: "section_dairy_management",
      },
    ];
  }
}
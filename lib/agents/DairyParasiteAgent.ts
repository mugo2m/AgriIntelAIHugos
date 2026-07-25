// lib/agents/DairyParasiteAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const PARASITE_SIGNS = [
  "visible_ticks",
  "visible_lice",
  "skin_irritation",
  "anaemia",
  "diarrhoea_parasite",
  "weight_loss",
  "bottle_jaw",
  "cough_parasite",
  "flies_swarming",
  "mange_lesions",
];

export class DairyParasiteAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyParasiteAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyParasiteSigns",
        type: "multiselect",
        questionKey: "question_dairy_parasite_signs",
        options: PARASITE_SIGNS,
        sectionKey: "section_dairy_health",
      },
    ];
  }
}
// lib/agents/DairyDeficiencyAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyDeficiencyAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyDeficiencySymptoms",
        type: "multiselect",
        label: "What nutritional deficiency symptoms are you seeing?",
        options: [
          { value: "stiff_gait", label: "Stiff gait / walking on eggshells" },
          { value: "poor_appetite", label: "Poor appetite / weight loss" },
          { value: "rough_coat", label: "Rough coat / scurfy skin" },
          { value: "muscle_tremors", label: "Muscle tremors (white muscle disease)" },
          { value: "scours", label: "Scours (diarrhoea) in calves" },
          { value: "nervous_signs", label: "Nervous signs / staggering" },
          { value: "reduced_milk_fat", label: "Reduced milk fat" },
          { value: "anaemia", label: "Anaemia / pale mucous membranes" },
          { value: "leg_weakness", label: "Leg weakness / lameness" },
          { value: "reproductive_problems", label: "Reproductive problems" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyDeficiency",
      collectedData: this.answers,
      message: "Deficiency symptoms collected.",
    };
  }
}
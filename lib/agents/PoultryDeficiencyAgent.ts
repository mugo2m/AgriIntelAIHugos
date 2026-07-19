// lib/agents/PoultryDeficiencyAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryDeficiencyAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "deficiencySymptoms",
        type: "multiselect",
        label: "What signs of nutritional deficiency are you seeing?",
        options: [
          { value: "stunted_growth", label: "Stunted growth – smaller than expected" },
          { value: "poor_feathering", label: "Poor feathering – bare patches" },
          { value: "feather_pecking", label: "Feather pecking / cannibalism" },
          { value: "thin_eggs", label: "Thin, soft, or shell‑less eggs" },
          { value: "leg_weakness", label: "Leg weakness or lameness" },
          { value: "perosis", label: "Perosis – slipped tendon, bent legs" },
          { value: "scaly_skin", label: "Scaly or cracked skin on legs and feet" },
          { value: "fluid_under_skin", label: "Fluid under the skin – greenish‑blue swelling" },
          { value: "ruffled_feathers", label: "Ruffled feathers – porcupine appearance" },
          { value: "sudden_death_def", label: "Sudden increase in death" },
          { value: "curled_toes", label: "Curled toes (riboflavin deficiency)" },
          { value: "twisted_neck", label: "Twisted neck – 'stargazing' (vitamin B1)" },
        ],
        required: true,
      },
      {
        id: "currentFeedTypeDef",
        type: "select",
        label: "What feed are you currently using?",
        options: [
          { value: "commercial_starter", label: "Commercial starter" },
          { value: "commercial_grower", label: "Commercial grower" },
          { value: "commercial_layer", label: "Commercial layer" },
          { value: "home_mixed", label: "Home‑mixed feed" },
        ],
        required: true,
      },
      {
        id: "symptomDurationDef",
        type: "select",
        label: "How long have these symptoms been present?",
        options: [
          { value: "less_than_3_days", label: "Less than 3 days" },
          { value: "3_to_7_days", label: "3 to 7 days" },
          { value: "more_than_1_week", label: "More than 1 week" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryDeficiency",
      collectedData: this.answers,
      message: "Deficiency symptoms collected.",
    };
  }
}
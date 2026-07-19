// lib/agents/PoultryDiseaseAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryDiseaseAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "symptomsObserved",
        type: "multiselect",
        label: "What symptoms are you seeing in your flock?",
        options: [
          { value: "respiratory", label: "Respiratory (gasping, coughing)" },
          { value: "green_diarrhoea", label: "Green diarrhoea" },
          { value: "white_diarrhoea", label: "White / chalky diarrhoea" },
          { value: "chocolate_diarrhoea", label: "Chocolate / bloody diarrhoea" },
          { value: "paralysis", label: "Paralysis / twisted neck" },
          { value: "scabs", label: "Scabs / skin lesions" },
          { value: "lameness", label: "Lameness / swollen joints" },
          { value: "sudden_death", label: "Sudden death" },
          { value: "swollen_face", label: "Swollen face / eyes" },
          { value: "egg_drop", label: "Drop in egg production" },
          { value: "tremors", label: "Tremors / head shaking" },
          { value: "depression", label: "Depression / huddling" },
        ],
        required: true,
      },
      {
        id: "mortalityCountDisease",
        type: "number",
        label: "How many birds have died in the last 7 days?",
        placeholder: "e.g., 5",
        required: false,
      },
      {
        id: "diseaseDuration",
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
      agentType: "PoultryDisease",
      collectedData: this.answers,
      message: "Disease symptoms collected.",
    };
  }
}
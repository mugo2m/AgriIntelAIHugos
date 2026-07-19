// lib/agents/DairyHealthAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyHealthAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairySymptoms",
        type: "multiselect",
        label: "What health symptoms are you seeing?",
        options: [
          { value: "swollen_udder", label: "Swollen, hot udder (mastitis)" },
          { value: "milk_changes", label: "Milk changes (clots, watery)" },
          { value: "recumbent", label: "Cow recumbent (down)" },
          { value: "fever", label: "Fever / depression" },
          { value: "coughing", label: "Coughing, nasal discharge" },
          { value: "diarrhoea", label: "Diarrhoea (chronic)" },
          { value: "lameness", label: "Lameness, swollen feet" },
          { value: "bloat", label: "Bloat (distended left side)" },
          { value: "ketosis", label: "Ketosis (fruity breath, weight loss)" },
          { value: "abortion", label: "Abortion / retained placenta" },
        ],
        required: true,
      },
      {
        id: "dairyMortalityCount",
        type: "number",
        label: "How many cows have died in the last month?",
        placeholder: "e.g., 1",
        required: false,
      },
      {
        id: "dairyHealthDuration",
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
      agentType: "DairyHealth",
      collectedData: this.answers,
      message: "Dairy health symptoms collected.",
    };
  }
}
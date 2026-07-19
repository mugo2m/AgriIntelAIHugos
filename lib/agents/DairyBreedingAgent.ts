// lib/agents/DairyBreedingAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyBreedingAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "daysSinceCalving",
        type: "number",
        label: "How many days since last calving?",
        placeholder: "e.g., 60",
        required: true,
      },
      {
        id: "heatObserved",
        type: "boolean",
        label: "Has the cow shown signs of heat (oestrus)?",
        required: true,
      },
      {
        id: "lastInseminationDate",
        type: "date",
        label: "When was the last insemination (if any)?",
        required: false,
      },
      {
        id: "breedingMethod",
        type: "select",
        label: "What breeding method do you use?",
        options: [
          { value: "ai", label: "Artificial insemination (AI)" },
          { value: "bull", label: "Natural bull" },
          { value: "both", label: "Both" },
        ],
        required: true,
      },
      {
        id: "reproductiveProblems",
        type: "multiselect",
        label: "Any reproductive problems?",
        options: [
          { value: "repeat_breeding", label: "Repeat breeding" },
          { value: "abortion", label: "Abortion" },
          { value: "retained_placenta", label: "Retained placenta" },
          { value: "none", label: "None" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyBreeding",
      collectedData: this.answers,
      message: "Breeding details collected.",
    };
  }
}
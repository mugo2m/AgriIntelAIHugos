// lib/agents/PestInterviewAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PestInterviewAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "commonPests",
        type: "multiselect",
        label: "What pests are you seeing? (select all that apply)",
        options: [
          { value: "Fall armyworm", label: "Fall armyworm" },
          { value: "Maize stalk borer", label: "Maize stalk borer" },
          { value: "Aphids", label: "Aphids" },
          { value: "Thrips", label: "Thrips" },
          { value: "Whiteflies", label: "Whiteflies" },
          { value: "Red spider mite", label: "Red spider mite" },
          { value: "Cutworms", label: "Cutworms" },
          { value: "Leaf miners", label: "Leaf miners" },
          { value: "Fruit flies", label: "Fruit flies" },
          { value: "Tuta absoluta", label: "Tuta absoluta" },
          { value: "Other", label: "Other" },
        ],
        required: true,
      },
      {
        id: "plantsDamaged",
        type: "number",
        label: "How many plants are damaged?",
        placeholder: "e.g., 50",
        required: false,
        step: "any",
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PestInterview",
      collectedData: this.answers,
      message: "Pest symptoms collected.",
    };
  }

  getAgentKey(): string {
    return this.constructor.name;
  }
}
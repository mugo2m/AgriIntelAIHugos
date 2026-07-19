// lib/agents/PoultrySetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultrySetupAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "poultryType",
        type: "select",
        label: "What type of poultry are you raising?",
        options: [
          { value: "layers", label: "Layers" },
          { value: "broilers", label: "Broilers" },
          { value: "dual_purpose", label: "Dual Purpose" },
        ],
        required: true,
      },
      {
        id: "breed",
        type: "select",
        label: "Which breed are you raising?",
        options: [
          { value: "local", label: "Local" },
          { value: "kuroiler", label: "Kuroiler" },
          { value: "sasso", label: "Sasso" },
          { value: "kenbro", label: "Kenbro" },
          { value: "isa_brown", label: "Isa Brown" },
          { value: "hyline", label: "Hyline" },
          { value: "cobb500", label: "Cobb 500" },
          { value: "ross308", label: "Ross 308" },
          { value: "sussex", label: "Sussex" },
        ],
        required: true,
      },
      {
        id: "flockSize",
        type: "number",
        label: "How many birds are in your flock?",
        placeholder: "e.g., 100",
        required: true,
      },
      {
        id: "ageWeeks",
        type: "number",
        label: "What is the average age of your flock in weeks?",
        placeholder: "e.g., 4",
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultrySetup",
      collectedData: this.answers,
      message: "Poultry setup details collected.",
    };
  }
}
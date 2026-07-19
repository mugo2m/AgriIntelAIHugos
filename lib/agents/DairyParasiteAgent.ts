// lib/agents/DairyParasiteAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyParasiteAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyParasiteSigns",
        type: "multiselect",
        label: "What signs of parasites are you seeing?",
        options: [
          { value: "visible_ticks", label: "Visible ticks" },
          { value: "visible_lice", label: "Visible lice" },
          { value: "skin_irritation", label: "Skin irritation / hair loss" },
          { value: "anaemia", label: "Anaemia (pale mucous membranes)" },
          { value: "diarrhoea_parasite", label: "Diarrhoea (may be black)" },
          { value: "weight_loss", label: "Weight loss" },
          { value: "bottle_jaw", label: "Bottle jaw (submandibular oedema)" },
          { value: "cough_parasite", label: "Cough (lungworms)" },
          { value: "flies_swarming", label: "Swarming flies" },
          { value: "mange_lesions", label: "Skin lesions / crusts" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyParasite",
      collectedData: this.answers,
      message: "Parasite signs collected.",
    };
  }
}
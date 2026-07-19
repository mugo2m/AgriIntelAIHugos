// lib/agents/PoultryConcentrateAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryConcentrateAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "concentrateBrand",
        type: "select",
        label: "Which concentrate brand do you use?",
        options: [
          { value: "wafi", label: "Wafi" },
          { value: "intraco", label: "Intraco" },
          { value: "koudijs", label: "Koudijs" },
          { value: "hendrix", label: "Hendrix" },
          { value: "nuscience", label: "Nuscience" },
          { value: "jubaili", label: "Jubaili" },
          { value: "unga", label: "Unga Farm Care" },
          { value: "afrimach", label: "Afrimach" },
          { value: "royal_dutch", label: "Royal Dutch" },
          { value: "farmers_choice", label: "Farmers Choice" },
        ],
        required: true,
      },
      {
        id: "concentrateProduct",
        type: "select",
        label: "Which specific concentrate product do you use?",
        options: [
          { value: "broiler_40", label: "Broiler Concentrate 40%" },
          { value: "layer_35", label: "Layer Concentrate 35%" },
          { value: "grower_30", label: "Grower Concentrate 30%" },
          { value: "layer_5", label: "Layer Concentrate 5%" },
          { value: "breeder", label: "Breeder Concentrate" },
        ],
        required: true,
      },
      {
        id: "inclusionRate",
        type: "number",
        label: "What is the inclusion rate printed on the bag? (kg per 100kg feed)",
        placeholder: "e.g., 35",
        required: false,
      },
      {
        id: "concentrateProtein",
        type: "number",
        label: "What is the protein percentage of this concentrate?",
        placeholder: "e.g., 35",
        required: false,
      },
      {
        id: "maizeKg",
        type: "number",
        label: "How many kilograms of maize will you add per 100kg feed?",
        placeholder: "e.g., 65",
        required: true,
      },
      {
        id: "saltKg",
        type: "number",
        label: "How many kilograms of salt will you add per 100kg feed?",
        placeholder: "e.g., 0.5",
        required: false,
      },
      {
        id: "calciumSource",
        type: "select",
        label: "Which calcium source will you use?",
        options: [
          { value: "limestone", label: "Limestone flour" },
          { value: "oyster_shell", label: "Oyster shell grit" },
          { value: "dcp", label: "DCP" },
          { value: "none", label: "None" },
        ],
        required: true,
      },
      {
        id: "calciumKg",
        type: "number",
        label: "How many kilograms of calcium source will you add per 100kg feed?",
        placeholder: "e.g., 3",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryConcentrate",
      collectedData: this.answers,
      message: "Concentrate feed details collected.",
    };
  }
}
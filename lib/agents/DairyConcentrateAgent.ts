// lib/agents/DairyConcentrateAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyConcentrateAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyConcentrateBrand",
        type: "select",
        label: "Which dairy concentrate brand do you use?",
        options: [
          { value: "koudijs", label: "Koudijs" },
          { value: "unga", label: "Unga Farm Care" },
          { value: "afrimach", label: "Afrimach" },
          { value: "jubaili", label: "Jubaili" },
          { value: "farmers_choice", label: "Farmers Choice" },
          { value: "royal_dutch", label: "Royal Dutch" },
          { value: "hendrix", label: "Hendrix" },
          { value: "intraco", label: "Intraco" },
          { value: "cargill", label: "Cargill" },
        ],
        required: true,
      },
      {
        id: "dairyConcentrateProduct",
        type: "select",
        label: "Which specific product?",
        options: [
          { value: "16pc", label: "Dairy Concentrate 16%" },
          { value: "18pc", label: "Dairy Concentrate 18%" },
          { value: "layer", label: "Dairy Layer/Concentrate" },
          { value: "dairy_meal", label: "Dairy Meal" },
        ],
        required: true,
      },
      {
        id: "dairyConcentrateInclusion",
        type: "number",
        label: "How many kilograms of concentrate per cow per day?",
        placeholder: "e.g., 3",
        required: true,
      },
      {
        id: "dairyConcentrateMaizeKg",
        type: "number",
        label: "How many kilograms of maize do you mix with the concentrate per cow per day?",
        placeholder: "e.g., 2",
        required: false,
      },
      {
        id: "dairyConcentrateSaltKg",
        type: "number",
        label: "How many kilograms of salt do you add per cow per day?",
        placeholder: "e.g., 0.05",
        required: false,
      },
      {
        id: "dairyConcentrateCalciumSource",
        type: "select",
        label: "Which calcium source do you use?",
        options: [
          { value: "limestone", label: "Limestone flour" },
          { value: "dcp", label: "DCP" },
          { value: "oyster_shell", label: "Oyster shell grit" },
          { value: "none", label: "None" },
        ],
        required: true,
      },
      {
        id: "dairyConcentrateCalciumKg",
        type: "number",
        label: "How many kilograms of calcium source do you add per cow per day?",
        placeholder: "e.g., 0.1",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyConcentrate",
      collectedData: this.answers,
      message: "Dairy concentrate details collected.",
    };
  }
}
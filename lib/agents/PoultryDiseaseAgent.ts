// lib/agents/PoultryDiseaseAgent.ts
import { BaseInterviewAgent } from "./BaseInterviewAgent";
import { poultryDiseaseMap } from "@/lib/data/poultryDiseaseMap";

export class PoultryDiseaseAgent extends BaseInterviewAgent {
  constructor() {
    super();

    const diseaseNames = Object.keys(poultryDiseaseMap).sort();

    this.questions = [
      {
        id: "poultry_disease",
        type: "dropdown",
        questionKey: "question_poultry_disease_select",
        options: diseaseNames,  // These are disease names from the map – they need to be translated keys too, or just used as-is if they are in the translation file
        required: true,
      },
      {
        id: "symptomsObserved",
        type: "multiselect",
        questionKey: "question_poultry_disease_symptoms",
        options: [
          "poultry_symptom_respiratory",
          "poultry_symptom_green_diarrhoea",
          "poultry_symptom_white_diarrhoea",
          "poultry_symptom_chocolate_diarrhoea",
          "poultry_symptom_paralysis",
          "poultry_symptom_scabs",
          "poultry_symptom_lameness",
          "poultry_symptom_sudden_death",
          "poultry_symptom_swollen_face",
          "poultry_symptom_egg_drop",
          "poultry_symptom_tremors",
          "poultry_symptom_depression",
        ],
        required: false,
      },
      {
        id: "mortalityCountDisease",
        type: "number",
        questionKey: "question_poultry_mortality_count_disease",
        placeholder: "e.g., 5",
        required: false,
      },
      {
        id: "diseaseDuration",
        type: "dropdown",
        questionKey: "question_poultry_disease_duration",
        options: [
          "poultry_duration_less_than_3_days",
          "poultry_duration_3_to_7_days",
          "poultry_duration_more_than_1_week",
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryDisease",
      collectedData: this.answers,
      message: "Poultry disease data collected.",
    };
  }
}
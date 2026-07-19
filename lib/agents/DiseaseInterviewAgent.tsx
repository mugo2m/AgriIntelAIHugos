// lib/agents/DiseaseInterviewAgent.ts
import { BaseInterviewAgent, InterviewQuestion, InterviewQuestionOption } from "./BaseInterviewAgent";
import { cropPestDiseaseMap } from "@/lib/data/pestDiseaseMapping";

/**
 * Build disease options for a given crop from the pest/disease mapping.
 * Returns an array of { value: diseaseName, label: diseaseName }.
 */
function getDiseaseOptionsForCrop(cropKey: string): InterviewQuestionOption[] {
  const entries = cropPestDiseaseMap[cropKey] || [];
  const diseaseEntries = entries.filter((item) => item.type === "disease");
  if (diseaseEntries.length === 0) {
    return [{ value: "other", label: "Other" }];
  }
  return diseaseEntries.map((item) => ({
    value: item.name,
    label: item.name,
  }));
}

export class DiseaseInterviewAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "commonDiseases",
        type: "multiselect",
        label: "What diseases are you seeing? (select all that apply)",
        options: [], // will be filled dynamically
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

  /**
   * Override getVisibleQuestions to inject dynamic disease options
   * based on the crop the farmer selected earlier.
   */
  getVisibleQuestions(answers: Record<string, any>): InterviewQuestion[] {
    const crop = answers.crops || "default";
    const diseaseOptions = getDiseaseOptionsForCrop(crop);

    return this.questions.map((q) => {
      if (q.id === "commonDiseases") {
        return { ...q, options: diseaseOptions };
      }
      return q;
    });
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DiseaseInterview",
      collectedData: this.answers,
      message: "Disease symptoms collected.",
    };
  }

  getAgentKey(): string {
    return this.constructor.name;
  }
}
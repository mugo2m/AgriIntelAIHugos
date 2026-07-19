// lib/agents/DairyCalfAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyCalfAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "calfAgeWeeks",
        type: "number",
        label: "What is the calf's age in weeks?",
        placeholder: "e.g., 4",
        required: true,
      },
      {
        id: "calfFeedingMethod",
        type: "select",
        label: "How is the calf fed?",
        options: [
          { value: "bucket", label: "Bucket" },
          { value: "bottle", label: "Bottle" },
          { value: "dam", label: "Dam (suckling)" },
          { value: "other", label: "Other" },
        ],
        required: true,
      },
      {
        id: "calfMilkLitresPerDay",
        type: "number",
        label: "How many litres of milk per day does the calf receive?",
        placeholder: "e.g., 6",
        required: false,
      },
      {
        id: "calfReceivedColostrum",
        type: "boolean",
        label: "Did the calf receive colostrum within the first 6 hours?",
        required: true,
      },
      {
        id: "calfHousingType",
        type: "select",
        label: "What type of housing is the calf in?",
        options: [
          { value: "individual_pen", label: "Individual pen" },
          { value: "group_pen", label: "Group pen" },
          { value: "tether", label: "Tether" },
          { value: "other", label: "Other" },
        ],
        required: true,
      },
      {
        id: "calfHealthIssues",
        type: "multiselect",
        label: "Any health issues?",
        options: [
          { value: "diarrhoea", label: "Diarrhoea (scours)" },
          { value: "cough", label: "Cough / pneumonia" },
          { value: "dullness", label: "Dullness / lethargy" },
          { value: "naval_infection", label: "Naval infection" },
          { value: "none", label: "None" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyCalf",
      collectedData: this.answers,
      message: "Calf rearing details collected.",
    };
  }
}
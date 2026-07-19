// lib/agents/PoultryFinancialAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryFinancialAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "chickPrice",
        type: "number",
        label: "What is the cost of one day‑old chick?",
        placeholder: "e.g., 120",
        required: true,
      },
      {
        id: "totalFeedCost",
        type: "number",
        label: "What is your total monthly feed cost?",
        placeholder: "e.g., 15000",
        required: true,
      },
      {
        id: "medicationCost",
        type: "number",
        label: "What is your total monthly medication cost?",
        placeholder: "e.g., 2000",
        required: false,
      },
      {
        id: "salePricePerBird",
        type: "number",
        label: "What is the sale price per bird (or per kg if sold by weight)?",
        placeholder: "e.g., 600",
        required: false,
      },
      {
        id: "saleWeightKg",
        type: "number",
        label: "What is the average sale weight in kg? (if sold by weight)",
        placeholder: "e.g., 2.5",
        required: false,
      },
      {
        id: "eggProduction",
        type: "number",
        label: "How many eggs does your flock produce per day?",
        placeholder: "e.g., 80",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryFinancial",
      collectedData: this.answers,
      message: "Financial details collected.",
    };
  }
}
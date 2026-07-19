// lib/agents/PoultryVaccinationAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryVaccinationAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "vaccinationType",
        type: "multiselect",
        label: "Which vaccinations have you done or planned?",
        options: [
          { value: "mareks", label: "Marek's (Day 1)" },
          { value: "newcastle_ib", label: "Newcastle + IB (Week 1)" },
          { value: "gumboro", label: "Gumboro (Week 2)" },
          { value: "newcastle_booster", label: "Newcastle Booster (Week 3)" },
          { value: "fowl_pox", label: "Fowl Pox (Week 4)" },
          { value: "fowl_typhoid", label: "Fowl Typhoid (Week 8)" },
          { value: "eds", label: "EDS (Week 16 – layers)" },
        ],
        required: false,
      },
      {
        id: "vaccinationCost",
        type: "number",
        label: "What is the total cost of vaccinations for your flock?",
        placeholder: "e.g., 1500",
        required: false,
      },
      {
        id: "lastVaccinationDate",
        type: "date",
        label: "When was the last vaccination given?",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryVaccination",
      collectedData: this.answers,
      message: "Vaccination details collected.",
    };
  }
}
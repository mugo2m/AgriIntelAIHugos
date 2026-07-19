// lib/agents/PoultryBroodingAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryBroodingAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "broodingWeek",
        type: "number",
        label: "Which brooding week are you in?",
        placeholder: "e.g., 2",
        required: true,
      },
      {
        id: "brooderTemperature",
        type: "number",
        label: "What is your brooder temperature (°C)?",
        placeholder: "e.g., 35",
        required: false,
      },
      {
        id: "litterType",
        type: "select",
        label: "What type of litter do you use?",
        options: [
          { value: "wood_shavings", label: "Wood shavings" },
          { value: "rice_hulls", label: "Rice hulls" },
          { value: "straw", label: "Straw" },
          { value: "none", label: "None" },
        ],
        required: true,
      },
      {
        id: "chickBehaviour",
        type: "select",
        label: "How are the chicks behaving?",
        options: [
          { value: "huddling", label: "Huddling together" },
          { value: "panting", label: "Panting / spreading out" },
          { value: "active", label: "Active and spread evenly" },
          { value: "lethargic", label: "Lethargic" },
        ],
        required: true,
      },
      {
        id: "vaccinationDone",
        type: "multiselect",
        label: "Which vaccinations have been done?",
        options: [
          { value: "mareks", label: "Marek's (Day 1)" },
          { value: "newcastle_ib", label: "Newcastle + IB (Week 1)" },
          { value: "gumboro", label: "Gumboro (Week 2)" },
        ],
        required: false,
      },
      {
        id: "mortalityCount",
        type: "number",
        label: "How many chicks have died so far?",
        placeholder: "e.g., 3",
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryBrooding",
      collectedData: this.answers,
      message: "Brooding details collected.",
    };
  }
}
// lib/agents/DairyReminderAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class DairyReminderAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "dairyLastDeworming",
        type: "date",
        label: "When was the last deworming?",
        required: false,
      },
      {
        id: "dairyLastHoofTrimming",
        type: "date",
        label: "When was the last hoof trimming?",
        required: false,
      },
      {
        id: "dairyLastVaccination",
        type: "date",
        label: "When was the last vaccination?",
        required: false,
      },
      {
        id: "dairyNextVaccinationDue",
        type: "date",
        label: "When is the next vaccination due?",
        required: false,
      },
      {
        id: "dairyReminderTopics",
        type: "multiselect",
        label: "What reminders would you like?",
        options: [
          { value: "deworming", label: "Deworming" },
          { value: "hoof_trimming", label: "Hoof trimming" },
          { value: "vaccination", label: "Vaccination" },
          { value: "ai_scheduling", label: "AI scheduling" },
          { value: "biosecurity", label: "Biosecurity" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "DairyReminder",
      collectedData: this.answers,
      message: "Dairy reminder settings collected.",
    };
  }
}
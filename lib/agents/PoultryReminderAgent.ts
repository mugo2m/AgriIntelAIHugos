// lib/agents/PoultryReminderAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryReminderAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "lastDeworming",
        type: "date",
        label: "When was the last deworming done?",
        required: false,
      },
      {
        id: "lastVaccinationDateReminder",
        type: "date",
        label: "When was the last vaccination given?",
        required: false,
      },
      {
        id: "nextVaccinationDue",
        type: "date",
        label: "When is the next vaccination due?",
        required: false,
      },
      {
        id: "lastHouseCleaning",
        type: "date",
        label: "When was the last full house cleaning?",
        required: false,
      },
      {
        id: "reminderTopics",
        type: "multiselect",
        label: "What reminders would you like?",
        options: [
          { value: "deworming", label: "Deworming" },
          { value: "vaccination", label: "Vaccination" },
          { value: "biosecurity", label: "Biosecurity check" },
          { value: "housing_cleaning", label: "House cleaning" },
          { value: "feed_inventory", label: "Feed inventory check" },
        ],
        required: false,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryReminder",
      collectedData: this.answers,
      message: "Reminder settings collected.",
    };
  }
}
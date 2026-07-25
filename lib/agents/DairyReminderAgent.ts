// lib/agents/DairyReminderAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const REMINDER_TOPICS = ["deworming", "hoof_trimming", "vaccination", "ai_scheduling", "biosecurity"];

export class DairyReminderAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyReminderAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyLastDeworming",
        type: "date",
        questionKey: "question_dairy_last_deworming",
        sectionKey: "section_dairy_reminders",
      },
      {
        id: "dairyLastHoofTrimming",
        type: "date",
        questionKey: "question_dairy_last_hoof_trimming",
        sectionKey: "section_dairy_reminders",
      },
      {
        id: "dairyLastVaccination",
        type: "date",
        questionKey: "question_dairy_last_vaccination",
        sectionKey: "section_dairy_reminders",
      },
      {
        id: "dairyNextVaccinationDue",
        type: "date",
        questionKey: "question_dairy_next_vaccination_due",
        sectionKey: "section_dairy_reminders",
      },
      {
        id: "dairyReminderTopics",
        type: "multiselect",
        questionKey: "question_dairy_reminder_topics",
        options: REMINDER_TOPICS,
        sectionKey: "section_dairy_reminders",
      },
    ];
  }
}
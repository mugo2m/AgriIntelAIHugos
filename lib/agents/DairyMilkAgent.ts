// lib/agents/DairyMilkAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const PARITY_OPTIONS = ["1", "2", "3", "4+"];

export class DairyMilkAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyMilkAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "milkYieldCurrent",
        type: "number",
        questionKey: "question_dairy_milk_yield_current",
        placeholder: "e.g., 15",
        step: "any",
        sectionKey: "section_dairy_production",
      },
      {
        id: "milkFatPercent",
        type: "number",
        questionKey: "question_dairy_milk_fat_percent",
        placeholder: "e.g., 4.0",
        step: "any",
        sectionKey: "section_dairy_production",
      },
      {
        id: "milkProteinPercent",
        type: "number",
        questionKey: "question_dairy_milk_protein_percent",
        placeholder: "e.g., 3.2",
        step: "any",
        sectionKey: "section_dairy_production",
      },
      {
        id: "daysInMilk",
        type: "number",
        questionKey: "question_dairy_days_in_milk",
        placeholder: "e.g., 120",
        step: "any",
        sectionKey: "section_dairy_production",
      },
      {
        id: "parity",
        type: "dropdown",
        questionKey: "question_dairy_parity",
        options: PARITY_OPTIONS,
        sectionKey: "section_dairy_production",
      },
    ];
  }
}
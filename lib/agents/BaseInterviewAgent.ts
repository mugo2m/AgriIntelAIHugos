// lib/agents/BaseInterviewAgent.ts
// lib/agents/BaseInterviewAgent.ts

// This matches the old "dependsOn" logic perfectly
export interface DependsOn {
  field: string;
  value?: string;
  valueNot?: string;
  field2?: string;
}

export interface InterviewQuestion {
  id: string;
  type: "text" | "number" | "dropdown" | "multiselect" | "date" | "button" | "custom";
  questionKey: string;       // The i18n key (e.g., "question_common_diseases")
  options?: string[];        // Hardcoded or dynamically generated options
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  dependsOn?: DependsOn;     // Conditional logic
  sectionKey?: string;       // e.g., "section_diseases"
  renderCustom?: boolean;    // For complex custom renders like nutrient dropdowns
}

// The context passed to every agent (answers collected so far)
export interface FarmerContext {
  crops?: string;
  hasDoneSoilTest?: string;
  country?: string;
  [key: string]: any; // Allow any other farmer detail
}

export abstract class BaseInterviewAgent {
  abstract getAgentKey(): string;
  // Returns the list of questions for this agent based on the current context
  abstract getQuestions(context: FarmerContext): InterviewQuestion[];
}
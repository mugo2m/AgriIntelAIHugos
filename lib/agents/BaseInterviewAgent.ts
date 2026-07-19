// lib/agents/BaseInterviewAgent.ts

export interface InterviewQuestion {
  id: string;
  type:
    | "text"
    | "number"
    | "select"
    | "multiselect"
    | "date"
    | "boolean"
    | "image";

  label: string;

  placeholder?: string;

  options?: {
    value: string;
    label: string;
  }[];

  required?: boolean;

  dependsOn?: {
    field: string;
    value: any;
  };

  validation?: (value: any) => boolean;
}

export interface InterviewAnswer {
  [key: string]: any;
}

export abstract class BaseInterviewAgent {
  protected questions: InterviewQuestion[] = [];

  protected answers: InterviewAnswer = {};

  getQuestions(): InterviewQuestion[] {
    return this.questions;
  }

  getAnswers(): InterviewAnswer {
    return this.answers;
  }

  setAnswer(questionId: string, value: any) {
    this.answers[questionId] = value;
  }

  getAnswer(questionId: string) {
    return this.answers[questionId];
  }

  hasAnswer(questionId: string) {
    return this.answers[questionId] !== undefined;
  }

  resetAnswers() {
    this.answers = {};
  }

  isQuestionVisible(question: InterviewQuestion): boolean {
    if (!question.dependsOn) return true;

    return (
      this.answers[question.dependsOn.field] ===
      question.dependsOn.value
    );
  }

  getVisibleQuestions(): InterviewQuestion[] {
    return this.questions.filter((q) =>
      this.isQuestionVisible(q)
    );
  }

  abstract generateRecommendation(): Promise<any>;
}
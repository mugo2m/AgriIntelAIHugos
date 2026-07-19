// lib/agents/AgentTypes.ts
import { InterviewQuestion } from "./BaseInterviewAgent";

export interface InterviewAgent {
  name: string;
  getQuestions(): InterviewQuestion[];
  isComplete(answers: Record<string, any>): boolean;
  getAnswers?(): Record<string, any>;
  reset?(): void;
}

export interface InterviewAgentConstructor {
  new (): InterviewAgent;
}

export interface AgentProgress {
  current: number;
  total: number;
  percentage: number;
  currentAgentName: string;
  isFinished: boolean;
}
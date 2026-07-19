// lib/agents/InterviewOrchestrator.ts
import { AgentRegistry } from "./AgentRegistry";
import { InterviewQuestion } from "./BaseInterviewAgent";
import { AgentProgress } from "./AgentTypes";

// ========== AGENT NAME MAPPING (Local fallback) ==========
const AGENT_NAMES: string[] = [
  "Enterprise Setup",
  "Fertilizer Management",
  "Pest Management",
  "Disease Management",
  "Nutrient Management",
  "Gross Margin",
  "Storage",
  "Conservation",
  "Good Agricultural Practices",
];

function getAgentName(index: number): string {
  return AGENT_NAMES[index] || `Agent ${index + 1}`;
}

// ========== ADAPTER: Wrap a question array as an agent ==========
class QuestionListAgent {
  private questions: InterviewQuestion[];
  private name: string;

  constructor(questions: InterviewQuestion[], name?: string) {
    this.questions = questions;
    this.name = name || "QuestionListAgent";
  }

  getQuestions(): InterviewQuestion[] {
    return this.questions;
  }

  getVisibleQuestions(answers: Record<string, any>): InterviewQuestion[] {
    return this.questions.filter((q) => {
      if (!q.dependsOn) return true;
      return Object.entries(q.dependsOn).every(([field, value]) => answers[field] === value);
    });
  }

  isComplete(answers: Record<string, any>): boolean {
    const required = this.questions.filter((q) => q.required !== false);
    return required.every((q) => {
      const val = answers[q.id];
      return val !== undefined && val !== null && val !== "";
    });
  }

  reset(): void {}

  async generateRecommendation(): Promise<any> {
    return { agentType: "QuestionListAgent", questionCount: this.questions.length };
  }

  getAgentName(): string {
    return this.name;
  }
}

export class InterviewOrchestrator {
  private currentAgentIndex: number = 0;
  private answers: Record<string, any> = {};
  private agents: any[] = [];
  private filteredAgentIndices: number[] = [];
  private isFiltered: boolean = false;

  constructor() {
    // Instantiate all agents, handling both class constructors and plain arrays
    this.agents = AgentRegistry.map((item) => {
      // If item is a class constructor (has a prototype), instantiate it
      if (typeof item === 'function' && item.prototype) {
        try {
          return new item();
        } catch (e) {
          console.warn(`⚠️ Failed to instantiate agent:`, item, e);
          return null;
        }
      }
      // If item is an array of questions, wrap it in an adapter
      if (Array.isArray(item)) {
        // Try to find a name from the registry's agent names
        const idx = AgentRegistry.indexOf(item);
        const name = getAgentName(idx);
        return new QuestionListAgent(item, name);
      }
      // If item is an object with a getQuestions method, assume it's already an agent instance
      if (typeof item === 'object' && item !== null && typeof item.getQuestions === 'function') {
        return item;
      }
      console.warn(`⚠️ Unknown agent type in registry:`, item);
      return null;
    }).filter(Boolean) as any[];

    // By default, all agents are visible
    this.filteredAgentIndices = this.agents.map((_, index) => index);
    this.isFiltered = false;
  }

  // ========== AGENT MANAGEMENT ==========

  getCurrentAgent(): any {
    if (this.filteredAgentIndices.length === 0) return null;
    const actualIndex = this.filteredAgentIndices[this.currentAgentIndex];
    return this.agents[actualIndex] || null;
  }

  getCurrentAgentName(): string {
    if (this.filteredAgentIndices.length === 0) return "No agents";
    const actualIndex = this.filteredAgentIndices[this.currentAgentIndex];
    const agent = this.agents[actualIndex];
    if (agent && typeof agent.getAgentName === 'function') {
      return agent.getAgentName();
    }
    // Fallback using the index within the filtered list
    return getAgentName(actualIndex) || `Agent ${actualIndex + 1}`;
  }

  getCurrentAgentClassName(): string {
    const agent = this.getCurrentAgent();
    if (!agent) return "";
    return agent.constructor?.name || "UnknownAgent";
  }

  getCurrentQuestions(): InterviewQuestion[] {
    const agent = this.getCurrentAgent();
    if (!agent) return [];
    if (typeof agent.getQuestions === "function") {
      return agent.getQuestions();
    }
    return [];
  }

  getVisibleQuestions(): InterviewQuestion[] {
    const agent = this.getCurrentAgent();
    if (!agent) return [];
    if (typeof agent.getVisibleQuestions === "function") {
      return agent.getVisibleQuestions(this.answers);
    }
    if (typeof agent.getQuestions === "function") {
      return agent.getQuestions();
    }
    return [];
  }

  // ========== AGENT FILTERING ==========

  filterAgents(agentNames: string[]): boolean {
    if (!agentNames || agentNames.length === 0) {
      this.filteredAgentIndices = this.agents.map((_, index) => index);
      this.isFiltered = false;
      this.currentAgentIndex = 0;
      return true;
    }

    const filteredIndices: number[] = [];
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      const className = agent.constructor?.name || "";
      const agentKey = typeof agent.getAgentKey === 'function' ? agent.getAgentKey() : className;
      if (agentNames.includes(className) || agentNames.includes(agentKey)) {
        filteredIndices.push(i);
      }
    }

    if (filteredIndices.length === 0) {
      console.warn(`⚠️ No agents matched names: ${agentNames.join(", ")}. Using all agents.`);
      this.filteredAgentIndices = this.agents.map((_, index) => index);
      this.isFiltered = false;
      this.currentAgentIndex = 0;
      return false;
    }

    this.filteredAgentIndices = filteredIndices;
    this.isFiltered = true;
    this.currentAgentIndex = 0;
    console.log(`✅ Filtered to ${filteredIndices.length} agents:`, filteredIndices.map(i => this.agents[i].constructor?.name || "Unknown"));
    return true;
  }

  getAllAgentNames(): string[] {
    return this.agents.map((agent) => agent.constructor?.name || "UnknownAgent");
  }

  getAllAgents(): any[] {
    return this.agents;
  }

  getFilteredAgentNames(): string[] {
    return this.filteredAgentIndices.map((idx) => this.agents[idx].constructor?.name || "UnknownAgent");
  }

  isFilteredMode(): boolean {
    return this.isFiltered && this.filteredAgentIndices.length < this.agents.length;
  }

  // ========== NAVIGATION ==========

  nextAgent(): boolean {
    if (this.currentAgentIndex < this.filteredAgentIndices.length - 1) {
      this.currentAgentIndex++;
      return true;
    }
    return false;
  }

  previousAgent(): boolean {
    if (this.currentAgentIndex > 0) {
      this.currentAgentIndex--;
      return true;
    }
    return false;
  }

  goToAgent(index: number): boolean {
    if (index >= 0 && index < this.filteredAgentIndices.length) {
      this.currentAgentIndex = index;
      return true;
    }
    return false;
  }

  skipToAgent(className: string): boolean {
    for (let i = 0; i < this.filteredAgentIndices.length; i++) {
      const actualIndex = this.filteredAgentIndices[i];
      const agent = this.agents[actualIndex];
      if (agent.constructor?.name === className) {
        this.currentAgentIndex = i;
        return true;
      }
    }
    return false;
  }

  getVisibleAgentCount(): number {
    return this.filteredAgentIndices.length;
  }

  getTotalAgentCount(): number {
    return this.agents.length;
  }

  // ========== STATE MANAGEMENT ==========

  isFinished(): boolean {
    return this.currentAgentIndex === this.filteredAgentIndices.length - 1;
  }

  isFirstAgent(): boolean {
    return this.currentAgentIndex === 0;
  }

  isLastAgent(): boolean {
    return this.currentAgentIndex === this.filteredAgentIndices.length - 1;
  }

  isCurrentAgentComplete(): boolean {
    const agent = this.getCurrentAgent();
    if (!agent) return false;
    if (typeof agent.isComplete === "function") {
      return agent.isComplete(this.answers);
    }
    const questions = this.getVisibleQuestions();
    const required = questions.filter((q) => q.required !== false);
    return required.every((q) => this.hasAnswer(q.id));
  }

  getProgress(): AgentProgress {
    const total = this.filteredAgentIndices.length;
    const current = this.currentAgentIndex + 1;
    return {
      current: current,
      total: total,
      percentage: total > 0 ? (current / total) * 100 : 0,
      currentAgentName: this.getCurrentAgentName(),
      isFinished: this.isFinished(),
    };
  }

  // ========== ANSWER MANAGEMENT ==========

  saveAnswer(questionId: string, value: any): void {
    this.answers[questionId] = value;
    const agent = this.getCurrentAgent();
    if (agent && typeof agent.setAnswer === "function") {
      agent.setAnswer(questionId, value);
    }
  }

  getAnswer(questionId: string): any {
    return this.answers[questionId];
  }

  getAnswers(): Record<string, any> {
    return this.answers;
  }

  hasAnswer(questionId: string): boolean {
    return this.answers[questionId] !== undefined && this.answers[questionId] !== null && this.answers[questionId] !== "";
  }

  getCurrentAgentAnswers(): Record<string, any> {
    const agent = this.getCurrentAgent();
    if (agent && typeof agent.getAnswers === "function") {
      return agent.getAnswers();
    }
    const questions = this.getCurrentQuestions();
    const agentAnswers: Record<string, any> = {};
    for (const q of questions) {
      if (this.hasAnswer(q.id)) {
        agentAnswers[q.id] = this.answers[q.id];
      }
    }
    return agentAnswers;
  }

  hasAllRequiredAnswers(): boolean {
    const questions = this.getVisibleQuestions();
    const required = questions.filter((q) => q.required !== false);
    return required.every((q) => this.hasAnswer(q.id));
  }

  // ========== RESET ==========

  reset(): void {
    this.currentAgentIndex = 0;
    this.answers = {};
    this.filteredAgentIndices = this.agents.map((_, index) => index);
    this.isFiltered = false;
    this.agents.forEach((agent) => {
      if (typeof agent.reset === "function") {
        agent.reset();
      }
    });
  }

  resetAnswers(): void {
    this.answers = {};
    this.agents.forEach((agent) => {
      if (typeof agent.reset === "function") {
        agent.reset();
      }
    });
  }

  // ========== RECOMMENDATION GENERATION ==========

  async generateConsolidatedRecommendation(): Promise<any> {
    const allAnswers = this.getAnswers();
    const recommendationData: Record<string, any> = {};

    for (const idx of this.filteredAgentIndices) {
      const agent = this.agents[idx];
      if (typeof agent.generateRecommendation === "function") {
        try {
          const result = await agent.generateRecommendation();
          const agentName = agent.constructor?.name?.replace("Agent", "").toLowerCase() || "unknown";
          recommendationData[agentName] = result;
        } catch (error) {
          console.error(`Error generating recommendation from ${agent.constructor?.name}:`, error);
        }
      }
    }

    return {
      ...recommendationData,
      allAnswers,
      agents: this.getFilteredAgentNames(),
      completedAt: new Date().toISOString(),
    };
  }

  getAllQuestions(): InterviewQuestion[] {
    const allQuestions: InterviewQuestion[] = [];
    for (const agent of this.agents) {
      if (typeof agent.getQuestions === "function") {
        const questions = agent.getQuestions();
        if (Array.isArray(questions)) {
          allQuestions.push(...questions);
        }
      }
    }
    return allQuestions;
  }

  getFilteredQuestions(): InterviewQuestion[] {
    const allQuestions: InterviewQuestion[] = [];
    for (const idx of this.filteredAgentIndices) {
      const agent = this.agents[idx];
      if (typeof agent.getQuestions === "function") {
        const questions = agent.getQuestions();
        if (Array.isArray(questions)) {
          allQuestions.push(...questions);
        }
      }
    }
    return allQuestions;
  }

  getStateSummary(): {
    currentAgent: string;
    currentAgentIndex: number;
    totalAgents: number;
    filtered: boolean;
    filteredAgentCount: number;
    answeredQuestions: number;
    totalQuestions: number;
    progress: AgentProgress;
  } {
    const allQuestions = this.getAllQuestions();
    const answered = Object.keys(this.answers).filter((key) => this.hasAnswer(key)).length;

    return {
      currentAgent: this.getCurrentAgentName(),
      currentAgentIndex: this.currentAgentIndex,
      totalAgents: this.filteredAgentIndices.length,
      filtered: this.isFilteredMode(),
      filteredAgentCount: this.filteredAgentIndices.length,
      answeredQuestions: answered,
      totalQuestions: allQuestions.length,
      progress: this.getProgress(),
    };
  }
}
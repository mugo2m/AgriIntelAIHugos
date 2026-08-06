// ==========================================================
// File: lib/services/AgentRegistry.ts
// Purpose:
// Central registry for all agents.
// ==========================================================

import { BaseAgent } from "@/lib/agents/BaseAgent";

// Memory
import { ConversationMemoryAgent } from "@/lib/agents/ConversationMemoryAgent";
import { UserPreferenceMemoryAgent } from "@/lib/agents/UserPreferenceMemoryAgent";
import { SessionMemoryAgent } from "@/lib/agents/SessionMemoryAgent";
import { AnalyticalMemoryAgent } from "@/lib/agents/AnalyticalMemoryAgent";

// Understanding
import { ContextAgent } from "@/lib/agents/ContextAgent";
import { SchemaAgent } from "@/lib/agents/SchemaAgent";
import { IntentAgent } from "@/lib/agents/IntentAgent";
import { EntityAgent } from "@/lib/agents/EntityAgent";
import { LocationResolutionAgent } from "@/lib/agents/LocationResolutionAgent";
import { TimeAgent } from "@/lib/agents/TimeAgent";
import { MetricAgent } from "@/lib/agents/MetricAgent";
import { FilterAgent } from "@/lib/agents/FilterAgent";
import { ValidationAgent } from "@/lib/agents/ValidationAgent";

// SQL
import { SQLPlannerAgent } from "@/lib/agents/SQLPlannerAgent";
import { SQLGenerationAgent } from "@/lib/agents/SQLGenerationAgent";
import { SQLValidationAgent } from "@/lib/agents/SQLValidationAgent";
import { ExecutionAgent } from "@/lib/agents/ExecutionAgent";

// Analytics
import { AnalysisAgent } from "@/lib/agents/AnalysisAgent";
import { VisualizationAgent } from "@/lib/agents/VisualizationAgent";
import { ReportAgent } from "@/lib/agents/ReportAgent";
import { ResponseAgent } from "@/lib/agents/ResponseAgent";

export class AgentRegistry {

    private agents = new Map<string, BaseAgent>();

    constructor() {

        // Memory

        this.register(new ConversationMemoryAgent());

        this.register(new UserPreferenceMemoryAgent());

        this.register(new SessionMemoryAgent());

        this.register(new AnalyticalMemoryAgent());

        // Understanding

        this.register(new ContextAgent());

        this.register(new SchemaAgent());

        this.register(new IntentAgent());

        this.register(new EntityAgent());

        this.register(new LocationResolutionAgent());

        this.register(new TimeAgent());

        this.register(new MetricAgent());

        this.register(new FilterAgent());

        this.register(new ValidationAgent());

        // SQL

        this.register(new SQLPlannerAgent());

        this.register(new SQLGenerationAgent());

        this.register(new SQLValidationAgent());

        this.register(new ExecutionAgent());

        // Analytics

        this.register(new AnalysisAgent());

        this.register(new VisualizationAgent());

        this.register(new ReportAgent());

        this.register(new ResponseAgent());

    }

    //--------------------------------------------------
    // Register Agent
    //--------------------------------------------------

    register(agent: BaseAgent): void {

        this.agents.set(

            agent.constructor.name,

            agent

        );

    }

    //--------------------------------------------------
    // Get Agent
    //--------------------------------------------------

    get<T extends BaseAgent>(

        name: string

    ): T {

        const agent = this.agents.get(name);

        if (!agent) {

            throw new Error(

                `Agent '${name}' not found.`

            );

        }

        return agent as T;

    }

    //--------------------------------------------------
    // Has Agent
    //--------------------------------------------------

    has(name: string): boolean {

        return this.agents.has(name);

    }

    //--------------------------------------------------
    // List Agents
    //--------------------------------------------------

    list(): string[] {

        return Array.from(

            this.agents.keys()

        );

    }

}
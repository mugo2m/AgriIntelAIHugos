// ==========================================================
// File: lib/services/AgentFactory.ts
// Purpose:
// Factory responsible for creating and providing agent
// instances throughout the SQL Analytics System.
// ==========================================================

import { BaseAgent } from "@/lib/agents/BaseAgent";

import { AgentRegistry } from "./AgentRegistry";

// Memory Agents
import { ConversationMemoryAgent } from "@/lib/agents/ConversationMemoryAgent";
import { UserPreferenceMemoryAgent } from "@/lib/agents/UserPreferenceMemoryAgent";
import { SessionMemoryAgent } from "@/lib/agents/SessionMemoryAgent";
import { AnalyticalMemoryAgent } from "@/lib/agents/AnalyticalMemoryAgent";

// Understanding Agents
import { ContextAgent } from "@/lib/agents/ContextAgent";
import { SchemaAgent } from "@/lib/agents/SchemaAgent";
import { IntentAgent } from "@/lib/agents/IntentAgent";
import { EntityAgent } from "@/lib/agents/EntityAgent";
import { LocationResolutionAgent } from "@/lib/agents/LocationResolutionAgent";
import { TimeAgent } from "@/lib/agents/TimeAgent";
import { MetricAgent } from "@/lib/agents/MetricAgent";
import { FilterAgent } from "@/lib/agents/FilterAgent";
import { ValidationAgent } from "@/lib/agents/ValidationAgent";

// SQL Agents
import { SQLPlannerAgent } from "@/lib/agents/SQLPlannerAgent";
import { SQLGenerationAgent } from "@/lib/agents/SQLGenerationAgent";
import { SQLValidationAgent } from "@/lib/agents/SQLValidationAgent";
import { ExecutionAgent } from "@/lib/agents/ExecutionAgent";

// Analytics Agents
import { AnalysisAgent } from "@/lib/agents/AnalysisAgent";
import { VisualizationAgent } from "@/lib/agents/VisualizationAgent";
import { ReportAgent } from "@/lib/agents/ReportAgent";
import { ResponseAgent } from "@/lib/agents/ResponseAgent";

// Supervisor
import { SupervisorAgent } from "@/lib/agents/SupervisorAgent";

export class AgentFactory {

    private static registry = new AgentRegistry();

    //--------------------------------------------------------
    // Generic Getter
    //--------------------------------------------------------

    static getAgent<T extends BaseAgent>(

        name: string

    ): T {

        return this.registry.get<T>(name);

    }

    //--------------------------------------------------------
    // Supervisor
    //--------------------------------------------------------

    static supervisor() {

        return new SupervisorAgent();

    }

    //--------------------------------------------------------
    // Memory Agents
    //--------------------------------------------------------

    static conversationMemory() {

        return this.getAgent<ConversationMemoryAgent>(
            "ConversationMemoryAgent"
        );

    }

    static userPreferenceMemory() {

        return this.getAgent<UserPreferenceMemoryAgent>(
            "UserPreferenceMemoryAgent"
        );

    }

    static sessionMemory() {

        return this.getAgent<SessionMemoryAgent>(
            "SessionMemoryAgent"
        );

    }

    static analyticalMemory() {

        return this.getAgent<AnalyticalMemoryAgent>(
            "AnalyticalMemoryAgent"
        );

    }

    //--------------------------------------------------------
    // Understanding Agents
    //--------------------------------------------------------

    static context() {

        return this.getAgent<ContextAgent>("ContextAgent");

    }

    static schema() {

        return this.getAgent<SchemaAgent>("SchemaAgent");

    }

    static intent() {

        return this.getAgent<IntentAgent>("IntentAgent");

    }

    static entity() {

        return this.getAgent<EntityAgent>("EntityAgent");

    }

    static location() {

        return this.getAgent<LocationResolutionAgent>(
            "LocationResolutionAgent"
        );

    }

    static time() {

        return this.getAgent<TimeAgent>("TimeAgent");

    }

    static metric() {

        return this.getAgent<MetricAgent>("MetricAgent");

    }

    static filter() {

        return this.getAgent<FilterAgent>("FilterAgent");

    }

    static validation() {

        return this.getAgent<ValidationAgent>(
            "ValidationAgent"
        );

    }

    //--------------------------------------------------------
    // SQL Agents
    //--------------------------------------------------------

    static planner() {

        return this.getAgent<SQLPlannerAgent>(
            "SQLPlannerAgent"
        );

    }

    static sqlGenerator() {

        return this.getAgent<SQLGenerationAgent>(
            "SQLGenerationAgent"
        );

    }

    static sqlValidator() {

        return this.getAgent<SQLValidationAgent>(
            "SQLValidationAgent"
        );

    }

    static execution() {

        return this.getAgent<ExecutionAgent>(
            "ExecutionAgent"
        );

    }

    //--------------------------------------------------------
    // Analytics Agents
    //--------------------------------------------------------

    static analysis() {

        return this.getAgent<AnalysisAgent>(
            "AnalysisAgent"
        );

    }

    static visualization() {

        return this.getAgent<VisualizationAgent>(
            "VisualizationAgent"
        );

    }

    static report() {

        return this.getAgent<ReportAgent>(
            "ReportAgent"
        );

    }

    static response() {

        return this.getAgent<ResponseAgent>(
            "ResponseAgent"
        );

    }

    //--------------------------------------------------------
    // List Registered Agents
    //--------------------------------------------------------

    static listAgents(): string[] {

        return this.registry.list();

    }

}
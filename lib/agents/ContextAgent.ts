// lib/agents/ContextAgent.ts

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

/**
 * ============================================================
 * Context Agent
 * ============================================================
 *
 * PURPOSE
 * -------
 * Understand the overall meaning of the user's question.
 *
 * This agent does NOT generate SQL.
 * This agent does NOT detect entities.
 *
 * It simply understands what the user wants.
 *
 * Examples
 * --------
 *
 * "Show maize production"
 *          ↓
 * Production Query
 *
 * "Compare maize and beans"
 *          ↓
 * Comparison Query
 *
 * "Why did production reduce?"
 *          ↓
 * Analytical Query
 *
 * "Which ward produced the highest maize?"
 *          ↓
 * Ranking Query
 *
 * ============================================================
 */

export type ContextType =

    | "production"

    | "comparison"

    | "trend"

    | "ranking"

    | "financial"

    | "forecast"

    | "recommendation"

    | "analysis"

    | "general";

export interface ContextInformation {

    originalQuestion: string;

    normalizedQuestion: string;

    contextType: ContextType;

    confidence: number;

}

export class ContextAgent extends BaseAgent {

    constructor() {

        super("Context Agent");

    }

    /**
     * Remove unnecessary words
     * and normalize the sentence.
     */

    private normalize(question: string): string {

        return question

            .toLowerCase()

            .replace(/[?.!,]/g, "")

            .replace(/\s+/g, " ")

            .trim();

    }

    /**
     * Determine the overall intent.
     */

    private determineContext(question: string): ContextType {

        if (

            question.includes("compare") ||

            question.includes("versus") ||

            question.includes("vs")

        ) {

            return "comparison";

        }

        if (

            question.includes("trend") ||

            question.includes("over time") ||

            question.includes("increase") ||

            question.includes("decrease")

        ) {

            return "trend";

        }

        if (

            question.includes("highest") ||

            question.includes("lowest") ||

            question.includes("top") ||

            question.includes("best")

        ) {

            return "ranking";

        }

        if (

            question.includes("profit") ||

            question.includes("income") ||

            question.includes("gross margin") ||

            question.includes("revenue") ||

            question.includes("value")

        ) {

            return "financial";

        }

        if (

            question.includes("forecast") ||

            question.includes("predict") ||

            question.includes("future")

        ) {

            return "forecast";

        }

        if (

            question.includes("recommend") ||

            question.includes("recommendation") ||

            question.includes("advice")

        ) {

            return "recommendation";

        }

        if (

            question.includes("why") ||

            question.includes("reason") ||

            question.includes("explain")

        ) {

            return "analysis";

        }

        if (

            question.includes("production") ||

            question.includes("yield") ||

            question.includes("acres")

        ) {

            return "production";

        }

        return "general";

    }

    async execute(
        context: AgentContext
    ): Promise<AgentResult> {

        const question = context.userQuestion;

        this.log(`Understanding context...`);

        const normalized = this.normalize(question);

        const contextType =

            this.determineContext(normalized);

        const contextInfo: ContextInformation = {

            originalQuestion: question,

            normalizedQuestion: normalized,

            contextType,

            confidence: 0.98

        };

        this.log(`Context identified: ${contextType}`);

        return this.success(contextInfo);

    }

}
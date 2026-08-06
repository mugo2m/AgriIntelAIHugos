// ============================================================
// File: lib/agents/MemoryAgent.ts
// Purpose:
// Maintains conversational context and remembers previous
// SQL analytics queries for follow-up questions.
// ============================================================

import { BaseAgent } from "./BaseAgent";

export interface ConversationMemory {

    previousQuestion?: string;

    previousIntent?: string;

    previousEntities?: any;

    previousLocation?: any;

    previousTime?: any;

    previousMetric?: any;

    previousSQL?: string;

    previousResults?: any;

}

export interface MemoryOutput {

    question: string;

    context: ConversationMemory;

    rewrittenQuestion: string;

}

export class MemoryAgent extends BaseAgent {

    private memory: ConversationMemory = {};

    constructor() {

        super("Memory Agent");

    }

    //---------------------------------------------------------
    // Store conversation
    //---------------------------------------------------------

    save(data: Partial<ConversationMemory>) {

        this.memory = {

            ...this.memory,

            ...data

        };

    }

    //---------------------------------------------------------
    // Retrieve conversation
    //---------------------------------------------------------

    getMemory(): ConversationMemory {

        return this.memory;

    }

    //---------------------------------------------------------
    // Clear conversation
    //---------------------------------------------------------

    clear() {

        this.memory = {};

    }

    //---------------------------------------------------------
    // Process follow-up question
    //---------------------------------------------------------

    async execute(question: string): Promise<MemoryOutput> {

        this.log("Checking conversation memory...");

        let rewrittenQuestion = question;

        //-----------------------------------------------------
        // Simple follow-up detection
        //-----------------------------------------------------

        const lower = question.toLowerCase();

        //-----------------------------------------------------
        // "what about bumula"
        //-----------------------------------------------------

        if (

            lower.startsWith("what about") ||

            lower.startsWith("and") ||

            lower.startsWith("also")

        ) {

            rewrittenQuestion =

                `${this.memory.previousQuestion} ${question}`;

        }

        //-----------------------------------------------------
        // "compare with 2024"
        //-----------------------------------------------------

        if (

            lower.includes("compare") ||

            lower.includes("last year") ||

            lower.includes("previous year")

        ) {

            rewrittenQuestion =

                `${this.memory.previousQuestion} ${question}`;

        }

        //-----------------------------------------------------
        // "show chart"
        //-----------------------------------------------------

        if (

            lower.includes("chart") ||

            lower.includes("graph") ||

            lower.includes("plot")

        ) {

            rewrittenQuestion =

                `${this.memory.previousQuestion} and show chart`;

        }

        //-----------------------------------------------------
        // "rank them"
        //-----------------------------------------------------

        if (

            lower.includes("rank") ||

            lower.includes("highest") ||

            lower.includes("lowest")

        ) {

            rewrittenQuestion =

                `${this.memory.previousQuestion} ${question}`;

        }

        //-----------------------------------------------------
        // "combined"
        //-----------------------------------------------------

        if (

            lower.includes("combined") ||

            lower.includes("total")

        ) {

            rewrittenQuestion =

                `${this.memory.previousQuestion} ${question}`;

        }

        //-----------------------------------------------------
        // Return
        //-----------------------------------------------------

        return {

            question,

            context: this.memory,

            rewrittenQuestion

        };

    }

}
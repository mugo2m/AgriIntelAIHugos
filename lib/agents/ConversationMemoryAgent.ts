// =========================================================
// File: lib/agents/ConversationMemoryAgent.ts
// Purpose:
// Maintains conversational history for follow-up questions.
// =========================================================

import { BaseAgent } from "./BaseAgent";

export interface ConversationContext {

    previousQuestion?: string;

    previousAnswer?: string;

    previousSQL?: string;

    previousIntent?: string;

    previousEntities?: any;

    previousMetrics?: any;

    previousFilters?: any;

    timestamp?: Date;

}

export class ConversationMemoryAgent extends BaseAgent {

    private conversation: ConversationContext = {};

    constructor() {

        super("Conversation Memory Agent");

    }

    //----------------------------------------------------
    // Save Conversation
    //----------------------------------------------------

    save(context: Partial<ConversationContext>): void {

        this.conversation = {

            ...this.conversation,

            ...context,

            timestamp: new Date()

        };

    }

    //----------------------------------------------------
    // Retrieve Conversation
    //----------------------------------------------------

    getConversation(): ConversationContext {

        return this.conversation;

    }

    //----------------------------------------------------
    // Clear Conversation
    //----------------------------------------------------

    clear(): void {

        this.conversation = {};

    }

    //----------------------------------------------------
    // Rewrite Follow-up Questions
    //----------------------------------------------------

    async execute(question: string): Promise<string> {

        this.log("Checking conversation history...");

        if (!this.conversation.previousQuestion) {

            return question;

        }

        const q = question.toLowerCase();

        //----------------------------------------------------
        // Detect follow-up questions
        //----------------------------------------------------

        const followUps = [

            "what about",

            "compare",

            "also",

            "and",

            "show",

            "plot",

            "graph",

            "chart",

            "rank",

            "highest",

            "lowest",

            "combined",

            "total"

        ];

        const isFollowUp =

            followUps.some(word => q.startsWith(word)) ||

            followUps.some(word => q.includes(word));

        if (isFollowUp) {

            return `${this.conversation.previousQuestion} ${question}`;

        }

        return question;

    }

}
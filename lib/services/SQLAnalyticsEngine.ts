// ==========================================================
// File: lib/services/SQLAnalyticsEngine.ts
// Purpose:
// Main entry point for the SQL Analytics Multi-Agent System.
// Every natural language question passes through here.
// ==========================================================

import { SupervisorAgent } from "@/lib/agents/SupervisorAgent";

export interface AnalyticsRequest {

    question: string;

    userId?: string;

    sessionId?: string;

}

export interface AnalyticsResponse {

    success: boolean;

    answer: string;

    executiveSummary?: string;

    insights?: string[];

    recommendations?: string[];

    followUpQuestions?: string[];

    charts?: any[];

    tables?: any[];

    metadata?: {

        executionTime: number;

        timestamp: Date;

        sessionId?: string;

    };

}

export class SQLAnalyticsEngine {

    private supervisor: SupervisorAgent;

    constructor() {

        this.supervisor = new SupervisorAgent();

    }

    //-----------------------------------------------------
    // Main Entry
    //-----------------------------------------------------

    async ask(
        request: AnalyticsRequest
    ): Promise<AnalyticsResponse> {

        const start = Date.now();

        try {

            const result =
                await this.supervisor.execute(
                    request.question
                );

            return {

                success: true,

                answer: result.answer,

                executiveSummary:
                    result.executiveSummary,

                insights:
                    result.insights,

                recommendations:
                    result.recommendations,

                followUpQuestions:
                    result.followUpQuestions,

                charts:
                    result.charts,

                tables:
                    result.tables,

                metadata: {

                    executionTime:
                        Date.now() - start,

                    timestamp:
                        new Date(),

                    sessionId:
                        request.sessionId

                }

            };

        }

        catch (error: any) {

            console.error(error);

            return {

                success: false,

                answer:
                    "Sorry, I was unable to process your request.",

                metadata: {

                    executionTime:
                        Date.now() - start,

                    timestamp:
                        new Date(),

                    sessionId:
                        request.sessionId

                }

            };

        }

    }

    //-----------------------------------------------------
    // Batch Questions
    //-----------------------------------------------------

    async askMany(
        questions: AnalyticsRequest[]
    ) {

        const responses = [];

        for (const question of questions) {

            responses.push(

                await this.ask(question)

            );

        }

        return responses;

    }

    //-----------------------------------------------------
    // Health Check
    //-----------------------------------------------------

    async health() {

        return {

            status: "Healthy",

            service: "SQL Analytics Engine",

            timestamp: new Date()

        };

    }

}
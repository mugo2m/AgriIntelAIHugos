// lib/agents/ResponseAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface ResponseResult {

    success: boolean;

    question: string;

    answer: string;

    executiveSummary: string;

    insights: string[];

    recommendations: string[];

    followUpQuestions: string[];

    charts?: any[];

    tables?: any[];

}

export class ResponseAgent extends BaseAgent {

    constructor() {

        super("Response Agent");

    }

    async execute(report: any): Promise<ResponseResult> {

        this.log("Generating final user response...");

        //----------------------------------------------------
        // Executive Summary
        //----------------------------------------------------

        const executiveSummary =
            report.summary || "";

        //----------------------------------------------------
        // Build Natural Language Answer
        //----------------------------------------------------

        let answer = executiveSummary;

        if (report.insights?.length) {

            answer += "\n\nKey Insights:\n";

            report.insights.forEach(

                (item: string) => {

                    answer += `• ${item}\n`;

                }

            );

        }

        if (report.recommendations?.length) {

            answer += "\nRecommendations:\n";

            report.recommendations.forEach(

                (item: string) => {

                    answer += `• ${item}\n`;

                }

            );

        }

        //----------------------------------------------------
        // Generate Follow-up Questions
        //----------------------------------------------------

        const followUpQuestions = [

            "Would you like a ward-level breakdown?",

            "Would you like to compare with another year?",

            "Would you like a chart of this result?",

            "Would you like to see financial value (KSh)?",

            "Would you like productivity per acre?"

        ];

        //----------------------------------------------------
        // Return
        //----------------------------------------------------

        return {

            success: true,

            question: report.question,

            answer,

            executiveSummary,

            insights: report.insights || [],

            recommendations:

                report.recommendations || [],

            followUpQuestions,

            charts: report.charts || [],

            tables: report.tables || []

        };

    }

}
// lib/agents/IntentAgent.ts

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

/**
 * ============================================================
 * Intent Agent
 * ============================================================
 *
 * PURPOSE
 * -------
 * Determine exactly what operation the user wants.
 *
 * ContextAgent determines WHAT KIND OF QUESTION.
 *
 * IntentAgent determines WHAT ACTION SHOULD BE PERFORMED.
 *
 * This information is later used by
 * SQLPlannerAgent.
 *
 * ============================================================
 *
 * Examples
 *
 * "Show maize production"
 *
 * Intent:
 * SELECT
 *
 * ------------------------------------------
 *
 * "Compare maize and beans"
 *
 * Intent:
 * COMPARE
 *
 * ------------------------------------------
 *
 * "Total maize production"
 *
 * Intent:
 * SUM
 *
 * ------------------------------------------
 *
 * "Average maize yield"
 *
 * Intent:
 * AVG
 *
 * ------------------------------------------
 *
 * "Highest maize production"
 *
 * Intent:
 * MAX
 *
 * ------------------------------------------
 *
 * "Lowest production"
 *
 * Intent:
 * MIN
 *
 * ------------------------------------------
 *
 * "Count wards growing maize"
 *
 * Intent:
 * COUNT
 *
 * ============================================================
 */

export type QueryIntent =

    | "SELECT"

    | "SUM"

    | "COUNT"

    | "AVG"

    | "MAX"

    | "MIN"

    | "COMPARE"

    | "TREND"

    | "RANK"

    | "FORECAST"

    | "RECOMMEND"

    | "UNKNOWN";

export interface IntentResult {

    intent: QueryIntent;

    confidence: number;

}

export class IntentAgent extends BaseAgent {

    constructor() {

        super("Intent Agent");

    }

    private detectIntent(question: string): QueryIntent {

        const q = question.toLowerCase();

        // Comparison

        if (

            q.includes("compare") ||

            q.includes("versus") ||

            q.includes("vs")

        ) {

            return "COMPARE";

        }

        // Sum

        if (

            q.includes("total") ||

            q.includes("combined") ||

            q.includes("sum")

        ) {

            return "SUM";

        }

        // Average

        if (

            q.includes("average") ||

            q.includes("mean")

        ) {

            return "AVG";

        }

        // Count

        if (

            q.includes("count") ||

            q.includes("how many") ||

            q.includes("number of")

        ) {

            return "COUNT";

        }

        // Maximum

        if (

            q.includes("highest") ||

            q.includes("largest") ||

            q.includes("maximum") ||

            q.includes("most") ||

            q.includes("top")

        ) {

            return "MAX";

        }

        // Minimum

        if (

            q.includes("lowest") ||

            q.includes("least") ||

            q.includes("minimum")

        ) {

            return "MIN";

        }

        // Trend

        if (

            q.includes("trend") ||

            q.includes("increase") ||

            q.includes("decrease") ||

            q.includes("over time")

        ) {

            return "TREND";

        }

        // Ranking

        if (

            q.includes("rank") ||

            q.includes("ranking")

        ) {

            return "RANK";

        }

        // Forecast

        if (

            q.includes("forecast") ||

            q.includes("predict") ||

            q.includes("future")

        ) {

            return "FORECAST";

        }

        // Recommendation

        if (

            q.includes("recommend") ||

            q.includes("advice")

        ) {

            return "RECOMMEND";

        }

        // Default

        return "SELECT";

    }

    async execute(
        context: AgentContext
    ): Promise<AgentResult> {

        this.log("Detecting user intent...");

        const intent = this.detectIntent(
            context.userQuestion
        );

        const result: IntentResult = {

            intent,

            confidence: 0.99

        };

        this.log(`Intent = ${intent}`);

        return this.success(result);

    }

}
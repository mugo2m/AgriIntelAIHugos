/**
 * ============================================================
 * IntentDetectionAgent.ts
 * ============================================================
 * Determines the user's intention before SQL generation.
 *
 * Examples
 * --------
 * Total production
 * Comparison
 * Trend
 * Ranking
 * Forecast
 * Market value
 * Farmers
 * Extension officers
 * Fertilizer
 * Yield
 * Gross margin
 * ============================================================
 */

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

export enum QueryIntent {

    TOTAL_PRODUCTION = "TOTAL_PRODUCTION",

    TOTAL_ACRES = "TOTAL_ACRES",

    TOTAL_FARMERS = "TOTAL_FARMERS",

    TOTAL_EXTENSION_OFFICERS = "TOTAL_EXTENSION_OFFICERS",

    YIELD = "YIELD",

    PRICE = "PRICE",

    MARKET_VALUE = "MARKET_VALUE",

    COMPARISON = "COMPARISON",

    TREND = "TREND",

    GROWTH = "GROWTH",

    RANKING = "RANKING",

    FORECAST = "FORECAST",

    FERTILIZER = "FERTILIZER",

    WEATHER = "WEATHER",

    PEST = "PEST",

    DISEASE = "DISEASE",

    RECOMMENDATION = "RECOMMENDATION",

    UNKNOWN = "UNKNOWN"

}

export class IntentDetectionAgent extends BaseAgent {

    constructor() {

        super("IntentDetectionAgent");

    }

    async execute(
        context: AgentContext
    ): Promise<AgentResult<QueryIntent>> {

        try {

            const question =
                this.normalize(context.question);

            this.log(
                `Analysing question: ${question}`
            );

            //--------------------------------------------------
            // Production
            //--------------------------------------------------

            if (
                question.includes("production") ||
                question.includes("produce") ||
                question.includes("harvest")
            ) {

                return this.success(
                    QueryIntent.TOTAL_PRODUCTION,
                    0.98
                );

            }

            //--------------------------------------------------
            // Acres
            //--------------------------------------------------

            if (
                question.includes("acre") ||
                question.includes("acres") ||
                question.includes("hectare")
            ) {

                return this.success(
                    QueryIntent.TOTAL_ACRES,
                    0.98
                );

            }

            //--------------------------------------------------
            // Farmers
            //--------------------------------------------------

            if (
                question.includes("farmer") ||
                question.includes("farmers")
            ) {

                return this.success(
                    QueryIntent.TOTAL_FARMERS,
                    0.97
                );

            }

            //--------------------------------------------------
            // Extension Officers
            //--------------------------------------------------

            if (
                question.includes("extension officer") ||
                question.includes("officers")
            ) {

                return this.success(
                    QueryIntent.TOTAL_EXTENSION_OFFICERS,
                    0.97
                );

            }

            //--------------------------------------------------
            // Fertilizer
            //--------------------------------------------------

            if (
                question.includes("fertilizer") ||
                question.includes("fertiliser") ||
                question.includes("dap") ||
                question.includes("urea") ||
                question.includes("can") ||
                question.includes("mop")
            ) {

                return this.success(
                    QueryIntent.FERTILIZER,
                    0.96
                );

            }

            //--------------------------------------------------
            // Yield
            //--------------------------------------------------

            if (
                question.includes("yield")
            ) {

                return this.success(
                    QueryIntent.YIELD,
                    0.97
                );

            }

            //--------------------------------------------------
            // Price
            //--------------------------------------------------

            if (
                question.includes("price") ||
                question.includes("selling")
            ) {

                return this.success(
                    QueryIntent.PRICE,
                    0.96
                );

            }

            //--------------------------------------------------
            // Market Value
            //--------------------------------------------------

            if (
                question.includes("value") ||
                question.includes("worth") ||
                question.includes("income") ||
                question.includes("revenue")
            ) {

                return this.success(
                    QueryIntent.MARKET_VALUE,
                    0.96
                );

            }

            //--------------------------------------------------
            // Comparison
            //--------------------------------------------------

            if (

                question.includes("compare") ||

                question.includes("versus") ||

                question.includes("vs") ||

                question.includes("difference") ||

                question.includes("combined")

            ) {

                return this.success(

                    QueryIntent.COMPARISON,

                    0.99

                );

            }

            //--------------------------------------------------
            // Trend
            //--------------------------------------------------

            if (

                question.includes("trend") ||

                question.includes("last") ||

                question.includes("previous") ||

                question.includes("history")

            ) {

                return this.success(

                    QueryIntent.TREND,

                    0.98

                );

            }

            //--------------------------------------------------
            // Growth
            //--------------------------------------------------

            if (

                question.includes("growth") ||

                question.includes("increase") ||

                question.includes("decline") ||

                question.includes("change")

            ) {

                return this.success(

                    QueryIntent.GROWTH,

                    0.98

                );

            }

            //--------------------------------------------------
            // Ranking
            //--------------------------------------------------

            if (

                question.includes("top") ||

                question.includes("highest") ||

                question.includes("lowest") ||

                question.includes("best") ||

                question.includes("rank")

            ) {

                return this.success(

                    QueryIntent.RANKING,

                    0.99

                );

            }

            //--------------------------------------------------
            // Forecast
            //--------------------------------------------------

            if (

                question.includes("forecast") ||

                question.includes("predict") ||

                question.includes("future")

            ) {

                return this.success(

                    QueryIntent.FORECAST,

                    0.98

                );

            }

            //--------------------------------------------------
            // Pest
            //--------------------------------------------------

            if (

                question.includes("pest") ||

                question.includes("fall armyworm")

            ) {

                return this.success(

                    QueryIntent.PEST,

                    0.98

                );

            }

            //--------------------------------------------------
            // Disease
            //--------------------------------------------------

            if (

                question.includes("disease") ||

                question.includes("blight")

            ) {

                return this.success(

                    QueryIntent.DISEASE,

                    0.98

                );

            }

            //--------------------------------------------------
            // Recommendation
            //--------------------------------------------------

            if (

                question.includes("recommend") ||

                question.includes("advice") ||

                question.includes("suggest")

            ) {

                return this.success(

                    QueryIntent.RECOMMENDATION,

                    0.98

                );

            }

            //--------------------------------------------------
            // Unknown
            //--------------------------------------------------

            return this.success(

                QueryIntent.UNKNOWN,

                0.30

            );

        }

        catch (error: any) {

            return this.failure(error.message);

        }

    }

}
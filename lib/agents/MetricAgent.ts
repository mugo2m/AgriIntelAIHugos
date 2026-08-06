// lib/agents/MetricAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface MetricContext {

  metric: string;

  aggregation:
    | "sum"
    | "avg"
    | "count"
    | "min"
    | "max"
    | "none";

  comparison?: boolean;

}

export class MetricAgent extends BaseAgent {

  async execute(question: string): Promise<MetricContext> {

    const q = question.toLowerCase();

    //---------------------------------------------------
    // Default
    //---------------------------------------------------

    const result: MetricContext = {

      metric: "",

      aggregation: "none",

      comparison: false

    };

    //---------------------------------------------------
    // PRODUCTION
    //---------------------------------------------------

    if (

      q.includes("production") ||

      q.includes("produce") ||

      q.includes("yield") ||

      q.includes("harvest")

    ) {

      result.metric = "production_kg";

    }

    //---------------------------------------------------
    // ACRES
    //---------------------------------------------------

    else if (

      q.includes("acre") ||

      q.includes("area") ||

      q.includes("hectare")

    ) {

      result.metric = "acres";

    }

    //---------------------------------------------------
    // FARMERS
    //---------------------------------------------------

    else if (

      q.includes("farmer") ||

      q.includes("growers")

    ) {

      result.metric = "farmers";

    }

    //---------------------------------------------------
    // EXTENSION OFFICERS
    //---------------------------------------------------

    else if (

      q.includes("extension officer") ||

      q.includes("agricultural officer")

    ) {

      result.metric = "extension_officers";

    }

    //---------------------------------------------------
    // PRICE
    //---------------------------------------------------

    else if (

      q.includes("price") ||

      q.includes("cost per kg")

    ) {

      result.metric = "price_per_kg";

    }

    //---------------------------------------------------
    // VALUE
    //---------------------------------------------------

    else if (

      q.includes("value") ||

      q.includes("income") ||

      q.includes("revenue")

    ) {

      result.metric = "total_value";

    }

    //---------------------------------------------------
    // TARGET PRODUCTION
    //---------------------------------------------------

    else if (

      q.includes("target production")

    ) {

      result.metric = "target_production";

    }

    //---------------------------------------------------
    // ACHIEVED PRODUCTION
    //---------------------------------------------------

    else if (

      q.includes("achieved production")

    ) {

      result.metric = "achieved_production";

    }

    //---------------------------------------------------
    // SOLD
    //---------------------------------------------------

    else if (

      q.includes("sold")

    ) {

      result.metric = "quantity_sold";

    }

    //---------------------------------------------------
    // CONSUMED
    //---------------------------------------------------

    else if (

      q.includes("consumed") ||

      q.includes("used locally")

    ) {

      result.metric = "quantity_consumed";

    }

    //---------------------------------------------------
    // AGGREGATIONS
    //---------------------------------------------------

    if (

      q.includes("total") ||

      q.includes("combined") ||

      q.includes("sum")

    ) {

      result.aggregation = "sum";

    }

    else if (

      q.includes("average") ||

      q.includes("mean")

    ) {

      result.aggregation = "avg";

    }

    else if (

      q.includes("maximum") ||

      q.includes("highest") ||

      q.includes("largest")

    ) {

      result.aggregation = "max";

    }

    else if (

      q.includes("minimum") ||

      q.includes("lowest") ||

      q.includes("smallest")

    ) {

      result.aggregation = "min";

    }

    else if (

      q.includes("count") ||

      q.includes("how many")

    ) {

      result.aggregation = "count";

    }

    //---------------------------------------------------
    // COMPARISON
    //---------------------------------------------------

    if (

      q.includes("compare") ||

      q.includes("versus") ||

      q.includes("vs")

    ) {

      result.comparison = true;

    }

    //---------------------------------------------------
    // Default aggregation
    //---------------------------------------------------

    if (

      result.metric !== "" &&

      result.aggregation === "none"

    ) {

      result.aggregation = "sum";

    }

    return result;

  }

}
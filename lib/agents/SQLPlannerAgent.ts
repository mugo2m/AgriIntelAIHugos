// lib/agents/SQLPlannerAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface SQLJoin {

    table: string;

    alias: string;

    on: string;

}

export interface SQLPlan {

    table: string;

    alias: string;

    metricColumn: string;

    aggregation: string;

    joins: SQLJoin[];

    filters: any[];

    groupBy: string[];

    orderBy: string[];

    limit?: number;

}

export class SQLPlannerAgent extends BaseAgent {

    constructor() {

        super("SQL Planner Agent");

    }

    async execute(context: any): Promise<SQLPlan> {

        this.log("Planning SQL execution...");

        //----------------------------------------------------
        // Default Main Table
        //----------------------------------------------------

        let table = "fact_crop_production";

        let alias = "cp";

        //----------------------------------------------------
        // Metric Mapping
        //----------------------------------------------------

        let metricColumn = "achieved_production_kg";

        switch (context.metric.metric) {

            case "production_kg":

                metricColumn = "achieved_production_kg";

                break;

            case "acres":

                metricColumn = "achieved_acres";

                break;

            case "target_production":

                metricColumn = "target_production_kg";

                break;

            case "achieved_production":

                metricColumn = "achieved_production_kg";

                break;

            case "farmers":

                metricColumn = "number_of_farmers";

                break;

            case "extension_officers":

                metricColumn = "number_of_extension_officers";

                break;

            case "price_per_kg":

                metricColumn = "price_per_kg";

                break;

            case "total_value":

                metricColumn = "total_value";

                break;

            case "quantity_sold":

                metricColumn = "quantity_sold";

                break;

            case "quantity_consumed":

                metricColumn = "quantity_consumed";

                break;

        }

        //----------------------------------------------------
        // Aggregation
        //----------------------------------------------------

        const aggregation =

            context.metric.aggregation.toUpperCase();

        //----------------------------------------------------
        // Filters
        //----------------------------------------------------

        const filters =

            context.filters.filters;

        //----------------------------------------------------
        // GROUP BY
        //----------------------------------------------------

        const groupBy: string[] = [];

        if (context.intent.intent === "group") {

            if (context.entities.groupField) {

                groupBy.push(

                    context.entities.groupField

                );

            }

        }

        //----------------------------------------------------
        // ORDER BY
        //----------------------------------------------------

        const orderBy: string[] = [];

        if (

            aggregation === "MAX" ||

            aggregation === "SUM"

        ) {

            orderBy.push(

                `${aggregation}(${metricColumn}) DESC`

            );

        }

        //----------------------------------------------------
        // JOINS
        //----------------------------------------------------

        const joins: SQLJoin[] = [

            {

                table: "dim_crop",

                alias: "c",

                on: "cp.crop_id = c.crop_id"

            },

            {

                table: "dim_location",

                alias: "l",

                on: "cp.location_id = l.location_id"

            },

            {

                table: "dim_time",

                alias: "t",

                on: "cp.time_id = t.time_id"

            }

        ];

        //----------------------------------------------------
        // LIMIT
        //----------------------------------------------------

        let limit;

        if (

            context.intent.intent === "top"

        ) {

            limit =

                context.intent.topN || 10;

        }

        //----------------------------------------------------
        // Final SQL Plan
        //----------------------------------------------------

        return {

            table,

            alias,

            metricColumn,

            aggregation,

            joins,

            filters,

            groupBy,

            orderBy,

            limit

        };

    }

}
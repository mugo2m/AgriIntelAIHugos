// lib/agents/ValidationAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface ValidationError {

    field: string;

    message: string;

}

export interface ValidationResult {

    valid: boolean;

    errors: ValidationError[];

    warnings: string[];

}

export class ValidationAgent extends BaseAgent {

    constructor() {

        super("Validation Agent");

    }

    async execute(context: any): Promise<ValidationResult> {

        this.log("Validating extracted query...");

        const errors: ValidationError[] = [];

        const warnings: string[] = [];

        //-------------------------------------------------------
        // Intent Validation
        //-------------------------------------------------------

        if (!context.intent) {

            errors.push({

                field: "intent",

                message: "Unable to determine user intent."

            });

        }

        //-------------------------------------------------------
        // Metric Validation
        //-------------------------------------------------------

        if (

            !context.metric ||

            !context.metric.metric

        ) {

            errors.push({

                field: "metric",

                message: "No metric was detected."

            });

        }

        //-------------------------------------------------------
        // Crop Validation
        //-------------------------------------------------------

        if (

            !context.entities?.crop

        ) {

            warnings.push(

                "Crop not specified. Query may return all crops."

            );

        }

        //-------------------------------------------------------
        // Time Validation
        //-------------------------------------------------------

        if (

            !context.time?.year &&

            !context.time?.startYear

        ) {

            warnings.push(

                "No year specified."

            );

        }

        //-------------------------------------------------------
        // Season Validation
        //-------------------------------------------------------

        if (

            !context.time?.season

        ) {

            warnings.push(

                "Season not specified."

            );

        }

        //-------------------------------------------------------
        // Location Validation
        //-------------------------------------------------------

        const hasCounty =
            context.location?.county;

        const hasSubcounty =
            context.location?.subcounties?.length > 0;

        const hasWard =
            context.location?.wards?.length > 0;

        if (

            !hasCounty &&

            !hasSubcounty &&

            !hasWard

        ) {

            warnings.push(

                "Location not specified."

            );

        }

        //-------------------------------------------------------
        // Aggregation Validation
        //-------------------------------------------------------

        if (

            !context.metric?.aggregation

        ) {

            warnings.push(

                "Aggregation not specified. SUM will be used."

            );

        }

        //-------------------------------------------------------
        // Filter Validation
        //-------------------------------------------------------

        if (

            !context.filters ||

            context.filters.filters.length === 0

        ) {

            warnings.push(

                "No SQL filters were generated."

            );

        }

        //-------------------------------------------------------
        // Comparison Validation
        //-------------------------------------------------------

        if (

            context.metric?.comparison &&

            !context.time?.compareYears

        ) {

            errors.push({

                field: "comparison",

                message: "Comparison requested but years are missing."

            });

        }

        //-------------------------------------------------------
        // Final Result
        //-------------------------------------------------------

        return {

            valid:

                errors.length === 0,

            errors,

            warnings

        };

    }

}
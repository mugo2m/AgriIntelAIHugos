// lib/agents/SQLValidationAgent.ts

import { BaseAgent } from "./BaseAgent";
import { SQLGenerationResult } from "./SQLGenerationAgent";

export interface SQLValidationResult {

    valid: boolean;

    sql: string;

    parameters: any[];

    errors: string[];

    warnings: string[];

}

export class SQLValidationAgent extends BaseAgent {

    constructor() {

        super("SQL Validation Agent");

    }

    async execute(
        query: SQLGenerationResult
    ): Promise<SQLValidationResult> {

        this.log("Validating SQL...");

        const errors: string[] = [];
        const warnings: string[] = [];

        const sql = query.sql.toUpperCase();

        //--------------------------------------------------
        // Empty SQL
        //--------------------------------------------------

        if (!query.sql || query.sql.trim() === "") {

            errors.push("SQL query is empty.");

        }

        //--------------------------------------------------
        // Must start with SELECT
        //--------------------------------------------------

        if (!sql.startsWith("SELECT")) {

            errors.push(
                "Only SELECT statements are allowed."
            );

        }

        //--------------------------------------------------
        // Dangerous SQL Detection
        //--------------------------------------------------

        const forbidden = [

            "DROP",

            "DELETE",

            "UPDATE",

            "INSERT",

            "ALTER",

            "TRUNCATE",

            "CREATE",

            "GRANT",

            "REVOKE"

        ];

        for (const keyword of forbidden) {

            if (sql.includes(keyword)) {

                errors.push(
                    `Forbidden SQL keyword detected: ${keyword}`
                );

            }

        }

        //--------------------------------------------------
        // SQL Injection Detection
        //--------------------------------------------------

        const injectionPatterns = [

            "--",

            ";--",

            "/*",

            "*/",

            "XP_",

            " OR 1=1",

            "' OR '",

            "\" OR \""

        ];

        for (const pattern of injectionPatterns) {

            if (sql.includes(pattern.toUpperCase())) {

                errors.push(
                    "Possible SQL injection detected."
                );

                break;

            }

        }

        //--------------------------------------------------
        // Parameter Count Check
        //--------------------------------------------------

        const placeholders =
            query.sql.match(/\$\d+/g);

        if (placeholders) {

            if (

                placeholders.length !==

                query.parameters.length

            ) {

                errors.push(

                    "Mismatch between SQL placeholders and parameters."

                );

            }

        }

        //--------------------------------------------------
        // Missing WHERE Warning
        //--------------------------------------------------

        if (

            !sql.includes("WHERE")

        ) {

            warnings.push(

                "Query has no WHERE clause. Entire table may be scanned."

            );

        }

        //--------------------------------------------------
        // LIMIT Warning
        //--------------------------------------------------

        if (

            !sql.includes("LIMIT")

        ) {

            warnings.push(

                "No LIMIT clause detected."

            );

        }

        //--------------------------------------------------
        // Aggregation without GROUP BY
        //--------------------------------------------------

        const hasAggregate =

            sql.includes("SUM(") ||

            sql.includes("AVG(") ||

            sql.includes("COUNT(") ||

            sql.includes("MIN(") ||

            sql.includes("MAX(");

        if (

            hasAggregate &&

            sql.includes(",") &&

            !sql.includes("GROUP BY")

        ) {

            warnings.push(

                "Possible missing GROUP BY clause."

            );

        }

        //--------------------------------------------------
        // Success
        //--------------------------------------------------

        return {

            valid: errors.length === 0,

            sql: query.sql,

            parameters: query.parameters,

            errors,

            warnings

        };

    }

}
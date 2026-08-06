// lib/agents/ExecutionAgent.ts

import { Pool } from "pg";
import { BaseAgent } from "./BaseAgent";
import { SQLValidationResult } from "./SQLValidationAgent";

export interface ExecutionResult {

    success: boolean;

    rows: any[];

    rowCount: number;

    executionTimeMs: number;

    sql: string;

    parameters: any[];

    error?: string;

}

export class ExecutionAgent extends BaseAgent {

    private pool: Pool;

    constructor(pool: Pool) {

        super("Execution Agent");

        this.pool = pool;

    }

    async execute(

        validatedSQL: SQLValidationResult

    ): Promise<ExecutionResult> {

        this.log("Executing PostgreSQL query...");

        //--------------------------------------------------
        // Stop if validation failed
        //--------------------------------------------------

        if (!validatedSQL.valid) {

            return {

                success: false,

                rows: [],

                rowCount: 0,

                executionTimeMs: 0,

                sql: validatedSQL.sql,

                parameters: validatedSQL.parameters,

                error: validatedSQL.errors.join("; ")

            };

        }

        //--------------------------------------------------
        // Execute SQL
        //--------------------------------------------------

        const start = Date.now();

        try {

            const result = await this.pool.query(

                validatedSQL.sql,

                validatedSQL.parameters

            );

            const executionTime =

                Date.now() - start;

            return {

                success: true,

                rows: result.rows,

                rowCount: result.rowCount ?? 0,

                executionTimeMs: executionTime,

                sql: validatedSQL.sql,

                parameters: validatedSQL.parameters

            };

        }

        catch (error: any) {

            return {

                success: false,

                rows: [],

                rowCount: 0,

                executionTimeMs: Date.now() - start,

                sql: validatedSQL.sql,

                parameters: validatedSQL.parameters,

                error: error.message

            };

        }

    }

}
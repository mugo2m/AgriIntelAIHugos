// lib/agents/SQLGenerationAgent.ts

import { BaseAgent } from "./BaseAgent";
import { SQLPlan } from "./SQLPlannerAgent";

export interface SQLGenerationResult {

    sql: string;

    parameters: any[];

}

export class SQLGenerationAgent extends BaseAgent {

    constructor() {

        super("SQL Generation Agent");

    }

    async execute(plan: SQLPlan): Promise<SQLGenerationResult> {

        this.log("Generating PostgreSQL query...");

        //---------------------------------------------------
        // SELECT
        //---------------------------------------------------

        let sql = `SELECT `;

        //---------------------------------------------------
        // GROUP BY fields
        //---------------------------------------------------

        if (plan.groupBy.length > 0) {

            sql += plan.groupBy.join(", ") + ", ";

        }

        //---------------------------------------------------
        // Metric
        //---------------------------------------------------

        sql += `${plan.aggregation}(${plan.alias}.${plan.metricColumn}) AS value `;

        //---------------------------------------------------
        // FROM
        //---------------------------------------------------

        sql += `FROM ${plan.table} ${plan.alias} `;

        //---------------------------------------------------
        // JOINS
        //---------------------------------------------------

        for (const join of plan.joins) {

            sql += `
INNER JOIN ${join.table} ${join.alias}
ON ${join.on}
`;

        }

        //---------------------------------------------------
        // WHERE
        //---------------------------------------------------

        const parameters: any[] = [];

        if (plan.filters.length > 0) {

            sql += ` WHERE `;

            const clauses: string[] = [];

            plan.filters.forEach((filter, index) => {

                switch (filter.operator) {

                    case "=":

                        clauses.push(
                            `${filter.column} = $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case "LIKE":

                        clauses.push(
                            `${filter.column} LIKE $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case ">":

                        clauses.push(
                            `${filter.column} > $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case "<":

                        clauses.push(
                            `${filter.column} < $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case ">=":

                        clauses.push(
                            `${filter.column} >= $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case "<=":

                        clauses.push(
                            `${filter.column} <= $${index + 1}`
                        );

                        parameters.push(filter.value);

                        break;

                    case "BETWEEN":

                        clauses.push(
                            `${filter.column} BETWEEN $${index + 1} AND $${index + 2}`
                        );

                        parameters.push(filter.value[0]);
                        parameters.push(filter.value[1]);

                        break;

                    case "IN":

                        const placeholders = filter.value
                            .map((_: any, i: number) => `$${parameters.length + i + 1}`)
                            .join(",");

                        clauses.push(
                            `${filter.column} IN (${placeholders})`
                        );

                        parameters.push(...filter.value);

                        break;

                }

            });

            sql += clauses.join(" AND ");

        }

        //---------------------------------------------------
        // GROUP BY
        //---------------------------------------------------

        if (plan.groupBy.length > 0) {

            sql += `
GROUP BY ${plan.groupBy.join(", ")}`;

        }

        //---------------------------------------------------
        // ORDER BY
        //---------------------------------------------------

        if (plan.orderBy.length > 0) {

            sql += `
ORDER BY ${plan.orderBy.join(", ")}`;

        }

        //---------------------------------------------------
        // LIMIT
        //---------------------------------------------------

        if (plan.limit) {

            sql += `
LIMIT ${plan.limit}`;

        }

        sql += ";";

        return {

            sql,

            parameters

        };

    }

}
// ==========================================================
// File: lib/services/SQLAnalyticsPipeline.ts
// Purpose:
// Executes the complete SQL Analytics workflow by coordinating
// all agents through the AgentFactory.
// ==========================================================

import { AgentFactory } from "./AgentFactory";

export interface PipelineRequest {

    question: string;

    userId?: string;

    sessionId?: string;

}

export interface PipelineResponse {

    success: boolean;

    answer: string;

    sql: string;

    data: any[];

    analysis: any;

    charts: any[];

    report: any;

    executionTime: number;

}

export class SQLAnalyticsPipeline {

    //--------------------------------------------------------
    // Execute Complete Workflow
    //--------------------------------------------------------

    async execute(

        request: PipelineRequest

    ): Promise<PipelineResponse> {

        const start = Date.now();

        //----------------------------------------------------
        // Memory
        //----------------------------------------------------

        const conversationMemory =
            AgentFactory.conversationMemory();

        const sessionMemory =
            AgentFactory.sessionMemory();

        const analyticalMemory =
            AgentFactory.analyticalMemory();

        const userPreferences =
            AgentFactory.userPreferenceMemory();

        //----------------------------------------------------
        // Step 1
        //----------------------------------------------------

        const rewrittenQuestion =

            await conversationMemory.execute(

                request.question

            );

        //----------------------------------------------------
        // Step 2
        //----------------------------------------------------

        const preferences =

            await userPreferences.execute();

        //----------------------------------------------------
        // Step 3
        //----------------------------------------------------

        const context =

            await AgentFactory.context()

            .execute({

                question: rewrittenQuestion,

                preferences

            });

        //----------------------------------------------------
        // Step 4
        //----------------------------------------------------

        const schema =

            await AgentFactory.schema()

            .execute(context);

        //----------------------------------------------------
        // Step 5
        //----------------------------------------------------

        const intent =

            await AgentFactory.intent()

            .execute({

                question: rewrittenQuestion,

                schema

            });

        //----------------------------------------------------
        // Step 6
        //----------------------------------------------------

        const entities =

            await AgentFactory.entity()

            .execute({

                question: rewrittenQuestion,

                schema

            });

        //----------------------------------------------------
        // Step 7
        //----------------------------------------------------

        const location =

            await AgentFactory.location()

            .execute({

                entities,

                schema

            });

        //----------------------------------------------------
        // Step 8
        //----------------------------------------------------

        const time =

            await AgentFactory.time()

            .execute({

                question: rewrittenQuestion

            });

        //----------------------------------------------------
        // Step 9
        //----------------------------------------------------

        const metric =

            await AgentFactory.metric()

            .execute({

                question: rewrittenQuestion,

                schema

            });

        //----------------------------------------------------
        // Step 10
        //----------------------------------------------------

        const filters =

            await AgentFactory.filter()

            .execute({

                entities,

                location,

                time

            });

        //----------------------------------------------------
        // Step 11
        //----------------------------------------------------

        await AgentFactory.validation()

        .execute({

            intent,

            entities,

            metric,

            filters

        });

        //----------------------------------------------------
        // Step 12
        //----------------------------------------------------

        const sqlPlan =

            await AgentFactory.planner()

            .execute({

                schema,

                intent,

                metric,

                filters

            });

        //----------------------------------------------------
        // Step 13
        //----------------------------------------------------

        const sql =

            await AgentFactory.sqlGenerator()

            .execute(sqlPlan);

        //----------------------------------------------------
        // Step 14
        //----------------------------------------------------

        await AgentFactory.sqlValidator()

        .execute(sql);

        //----------------------------------------------------
        // Step 15
        //----------------------------------------------------

        const data =

            await AgentFactory.execution()

            .execute(sql);

        //----------------------------------------------------
        // Step 16
        //----------------------------------------------------

        const analysis =

            await AgentFactory.analysis()

            .execute({

                question: rewrittenQuestion,

                data,

                metric

            });

        //----------------------------------------------------
        // Step 17
        //----------------------------------------------------

        const charts =

            await AgentFactory.visualization()

            .execute({

                data,

                analysis

            });

        //----------------------------------------------------
        // Step 18
        //----------------------------------------------------

        const report =

            await AgentFactory.report()

            .execute({

                question: rewrittenQuestion,

                data,

                analysis,

                charts

            });

        //----------------------------------------------------
        // Step 19
        //----------------------------------------------------

        const response =

            await AgentFactory.response()

            .execute(report);

        //----------------------------------------------------
        // Save Conversation Memory
        //----------------------------------------------------

        conversationMemory.save({

            previousQuestion:

                rewrittenQuestion,

            previousAnswer:

                response.answer,

            previousSQL:

                sql,

            previousIntent:

                intent,

            previousEntities:

                entities,

            previousMetrics:

                metric,

            previousFilters:

                filters

        });

        //----------------------------------------------------
        // Save Session Memory
        //----------------------------------------------------

        sessionMemory.save({

            crop: entities.crop,

            county: location.county,

            subCounty: location.subCounty,

            ward: location.ward,

            season: time.season,

            year: time.year,

            metric: metric.name,

            sql,

            lastResult: data

        });

        //----------------------------------------------------
        // Save Analytical Memory
        //----------------------------------------------------

        analyticalMemory.save({

            id: Date.now().toString(),

            timestamp: new Date(),

            question: rewrittenQuestion,

            sql,

            entities,

            filters,

            metrics: metric,

            results: data,

            insights:

                analysis.insights,

            recommendations:

                analysis.recommendations,

            charts,

            report

        });

        //----------------------------------------------------

        return {

            success: true,

            answer: response.answer,

            sql,

            data,

            analysis,

            charts,

            report,

            executionTime:

                Date.now() - start

        };

    }

}
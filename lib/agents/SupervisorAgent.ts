// ==========================================================
// File: lib/agents/SupervisorAgent.ts
// Purpose:
// Master Orchestrator of the SQL Analytics Multi-Agent System
// ==========================================================

import { BaseAgent } from "./BaseAgent";

// -------------------- Memory --------------------

import { ConversationMemoryAgent } from "./ConversationMemoryAgent";
import { UserPreferenceMemoryAgent } from "./UserPreferenceMemoryAgent";
import { SessionMemoryAgent } from "./SessionMemoryAgent";
import { AnalyticalMemoryAgent } from "./AnalyticalMemoryAgent";

// -------------------- Understanding --------------------

import { ContextAgent } from "./ContextAgent";
import { SchemaAgent } from "./SchemaAgent";
import { IntentAgent } from "./IntentAgent";
import { EntityAgent } from "./EntityAgent";
import { LocationResolutionAgent } from "./LocationResolutionAgent";
import { TimeAgent } from "./TimeAgent";
import { MetricAgent } from "./MetricAgent";
import { FilterAgent } from "./FilterAgent";
import { ValidationAgent } from "./ValidationAgent";

// -------------------- SQL --------------------

import { SQLPlannerAgent } from "./SQLPlannerAgent";
import { SQLGenerationAgent } from "./SQLGenerationAgent";
import { SQLValidationAgent } from "./SQLValidationAgent";
import { ExecutionAgent } from "./ExecutionAgent";

// -------------------- Analytics --------------------

import { AnalysisAgent } from "./AnalysisAgent";
import { VisualizationAgent } from "./VisualizationAgent";
import { ReportAgent } from "./ReportAgent";
import { ResponseAgent } from "./ResponseAgent";

export class SupervisorAgent extends BaseAgent {

    //---------------- Memory ----------------

    private conversationMemory =
        new ConversationMemoryAgent();

    private userPreferenceMemory =
        new UserPreferenceMemoryAgent();

    private sessionMemory =
        new SessionMemoryAgent();

    private analyticalMemory =
        new AnalyticalMemoryAgent();

    //---------------- Understanding ----------------

    private contextAgent =
        new ContextAgent();

    private schemaAgent =
        new SchemaAgent();

    private intentAgent =
        new IntentAgent();

    private entityAgent =
        new EntityAgent();

    private locationAgent =
        new LocationResolutionAgent();

    private timeAgent =
        new TimeAgent();

    private metricAgent =
        new MetricAgent();

    private filterAgent =
        new FilterAgent();

    private validationAgent =
        new ValidationAgent();

    //---------------- SQL ----------------

    private plannerAgent =
        new SQLPlannerAgent();

    private sqlGenerationAgent =
        new SQLGenerationAgent();

    private sqlValidationAgent =
        new SQLValidationAgent();

    private executionAgent =
        new ExecutionAgent();

    //---------------- Analytics ----------------

    private analysisAgent =
        new AnalysisAgent();

    private visualizationAgent =
        new VisualizationAgent();

    private reportAgent =
        new ReportAgent();

    private responseAgent =
        new ResponseAgent();

    constructor() {

        super("Supervisor Agent");

    }

    //====================================================
    // MASTER WORKFLOW
    //====================================================

    async execute(question: string) {

        this.log("================================");

        this.log("Starting SQL Analytics Workflow");

        this.log("================================");

        //--------------------------------------------------
        // 1. Conversation Memory
        //--------------------------------------------------

        const rewrittenQuestion =
            await this.conversationMemory.execute(question);

        //--------------------------------------------------
        // 2. User Preferences
        //--------------------------------------------------

        const preferences =
            await this.userPreferenceMemory.execute();

        //--------------------------------------------------
        // 3. Session Memory
        //--------------------------------------------------

        const session =
            await this.sessionMemory.execute();

        //--------------------------------------------------
        // 4. Context
        //--------------------------------------------------

        const context =
            await this.contextAgent.execute({

                question: rewrittenQuestion,

                preferences,

                session

            });

        //--------------------------------------------------
        // 5. Database Schema
        //--------------------------------------------------

        const schema =
            await this.schemaAgent.execute(context);

        //--------------------------------------------------
        // 6. Intent
        //--------------------------------------------------

        const intent =
            await this.intentAgent.execute({

                question: rewrittenQuestion,

                schema

            });

        //--------------------------------------------------
        // 7. Entity Extraction
        //--------------------------------------------------

        const entities =
            await this.entityAgent.execute({

                question: rewrittenQuestion,

                schema

            });

        //--------------------------------------------------
        // 8. Location Resolution
        //--------------------------------------------------

        const location =
            await this.locationAgent.execute({

                entities,

                schema

            });

        //--------------------------------------------------
        // 9. Time
        //--------------------------------------------------

        const time =
            await this.timeAgent.execute({

                question: rewrittenQuestion

            });

        //--------------------------------------------------
        // 10. Metric
        //--------------------------------------------------

        const metric =
            await this.metricAgent.execute({

                question: rewrittenQuestion,

                schema

            });

        //--------------------------------------------------
        // 11. Filter
        //--------------------------------------------------

        const filters =
            await this.filterAgent.execute({

                entities,

                location,

                time

            });

        //--------------------------------------------------
        // 12. Validation
        //--------------------------------------------------

        await this.validationAgent.execute({

            intent,

            entities,

            metric,

            filters

        });

        //--------------------------------------------------
        // 13. SQL Planning
        //--------------------------------------------------

        const plan =
            await this.plannerAgent.execute({

                intent,

                metric,

                filters,

                schema

            });

        //--------------------------------------------------
        // 14. SQL Generation
        //--------------------------------------------------

        const sql =
            await this.sqlGenerationAgent.execute(plan);

        //--------------------------------------------------
        // 15. SQL Validation
        //--------------------------------------------------

        await this.sqlValidationAgent.execute(sql);

        //--------------------------------------------------
        // 16. SQL Execution
        //--------------------------------------------------

        const data =
            await this.executionAgent.execute(sql);

        //--------------------------------------------------
        // 17. Analysis
        //--------------------------------------------------

        const analysis =
            await this.analysisAgent.execute({

                question: rewrittenQuestion,

                data

            });

        //--------------------------------------------------
        // 18. Visualization
        //--------------------------------------------------

        const charts =
            await this.visualizationAgent.execute({

                analysis,

                data

            });

        //--------------------------------------------------
        // 19. Report
        //--------------------------------------------------

        const report =
            await this.reportAgent.execute({

                question: rewrittenQuestion,

                analysis,

                charts,

                data

            });

        //--------------------------------------------------
        // 20. Response
        //--------------------------------------------------

        const response =
            await this.responseAgent.execute(report);

        //--------------------------------------------------
        // Save Memories
        //--------------------------------------------------

        this.conversationMemory.save({

            previousQuestion: rewrittenQuestion,

            previousAnswer: response.answer,

            previousSQL: sql,

            previousIntent: intent,

            previousEntities: entities,

            previousMetrics: metric,

            previousFilters: filters

        });

        this.sessionMemory.save({

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

        this.analyticalMemory.save({

            id: Date.now().toString(),

            timestamp: new Date(),

            question: rewrittenQuestion,

            sql,

            entities,

            filters,

            metrics: metric,

            results: data,

            insights: analysis.insights,

            recommendations:
                analysis.recommendations,

            charts,

            report

        });

        //--------------------------------------------------

        this.log("Workflow Completed Successfully.");

        return response;

    }

}
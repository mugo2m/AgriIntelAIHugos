// lib/agents/EntityAgent.ts

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

/**
 * ============================================================
 * Entity Agent
 * ============================================================
 *
 * PURPOSE
 * -------
 * Extract every important entity from the user's question.
 *
 * This agent does NOT generate SQL.
 * This agent does NOT understand database schema.
 *
 * It only identifies WHAT the user is talking about.
 *
 * Examples
 * --------
 *
 * User:
 * "What is Tongaren and Bumula maize production
 * in Short Rain 2025 combined?"
 *
 * Output
 * ------
 *
 * crop:
 * maize
 *
 * locations:
 * Tongaren
 * Bumula
 *
 * season:
 * Short Rain
 *
 * year:
 * 2025
 *
 * metric:
 * production
 *
 * ============================================================
 */

export interface QueryEntities {

    crop?: string;

    variety?: string;

    county?: string;

    subcounties: string[];

    wards: string[];

    season?: string;

    year?: number;

    metric?: string;

    units?: string;

}

export class EntityAgent extends BaseAgent {

    constructor() {

        super("Entity Agent");

    }

    /**
     * Crops
     */

    private crops = [

        "maize",

        "beans",

        "coffee",

        "tea",

        "banana",

        "rice",

        "cassava",

        "sorghum",

        "millet",

        "wheat",

        "groundnuts",

        "tomatoes",

        "potatoes",

        "onions",

        "sunflower"

    ];

    /**
     * Bungoma subcounties
     */

    private subcounties = [

        "bumula",

        "tongaren",

        "kabuchai",

        "sirisia",

        "kanduyi",

        "mt elgon",

        "webuye east",

        "webuye west",

        "kimilili"

    ];

    /**
     * Seasons
     */

    private seasons = [

        "long rain",

        "short rain",

        "long rains",

        "short rains"

    ];

    /**
     * Metrics
     */

    private metrics = [

        "production",

        "yield",

        "acres",

        "farmers",

        "price",

        "value",

        "income",

        "profit"

    ];

    async execute(
        context: AgentContext
    ): Promise<AgentResult> {

        this.log("Extracting entities...");

        const question =
            context.userQuestion.toLowerCase();

        const entities: QueryEntities = {

            subcounties: [],

            wards: []

        };

        /**
         * Crop
         */

        for (const crop of this.crops) {

            if (question.includes(crop)) {

                entities.crop = crop;

                break;

            }

        }

        /**
         * Subcounties
         */

        for (const subcounty of this.subcounties) {

            if (question.includes(subcounty)) {

                entities.subcounties.push(subcounty);

            }

        }

        /**
         * Season
         */

        for (const season of this.seasons) {

            if (question.includes(season)) {

                entities.season = season;

                break;

            }

        }

        /**
         * Year
         */

        const yearMatch =
            question.match(/\b(20\d{2})\b/);

        if (yearMatch) {

            entities.year =
                Number(yearMatch[1]);

        }

        /**
         * Metric
         */

        for (const metric of this.metrics) {

            if (question.includes(metric)) {

                entities.metric = metric;

                break;

            }

        }

        /**
         * Units
         */

        if (

            question.includes("kg") ||

            question.includes("kilogram")

        ) {

            entities.units = "kg";

        }

        else if (

            question.includes("acre") ||

            question.includes("acres")

        ) {

            entities.units = "acres";

        }

        this.log("Entities extracted successfully.");

        return this.success(entities);

    }

}
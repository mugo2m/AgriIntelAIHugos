/**
 * ==========================================================
 * EntityExtractionAgent
 * ==========================================================
 *
 * Extracts structured entities from natural language.
 *
 * Example
 *
 * "What is maize production in Tongaren
 * during Short Rain 2025?"
 *
 * =>
 *
 * crop = maize
 * subcounty = Tongaren
 * season = Short Rain
 * year = 2025
 *
 * ==========================================================
 */

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

export interface ExtractedEntities {

    crop?: string;

    county?: string;

    subcounties?: string[];

    ward?: string;

    season?: string;

    year?: number;

    metric?: string;

    fertilizer?: string;

    comparison?: boolean;

}

export class EntityExtractionAgent extends BaseAgent {

    constructor() {

        super("EntityExtractionAgent");

    }

    //----------------------------------------------------

    private readonly crops = [

        "maize",
        "beans",
        "coffee",
        "tea",
        "rice",
        "cassava",
        "banana",
        "banana",
        "potatoes",
        "sweet potatoes",
        "groundnuts",
        "sunflower",
        "tomatoes",
        "onions",
        "cabbages",
        "kales",
        "sorghum",
        "millet",
        "soybeans",
        "green grams"

    ];

    //----------------------------------------------------

    private readonly seasons = [

        "long rain",

        "short rain",

        "long rains",

        "short rains"

    ];

    //----------------------------------------------------

    private readonly fertilizers = [

        "dap",

        "urea",

        "can",

        "mop",

        "npk",

        "tsp",

        "ssp"

    ];

    //----------------------------------------------------

    private readonly subcounties = [

        "tongaren",

        "bumula",

        "kabuchai",

        "sirisia",

        "mt elgon",

        "webuye east",

        "webuye west",

        "kanduyi",

        "kimilili"

    ];

    //----------------------------------------------------

    async execute(

        context: AgentContext

    ): Promise<AgentResult<ExtractedEntities>> {

        try {

            const question =
                this.normalize(context.question);

            const entities: ExtractedEntities = {

                subcounties: []

            };

            //------------------------------------------------
            // Crop
            //------------------------------------------------

            for (const crop of this.crops) {

                if (question.includes(crop)) {

                    entities.crop = crop;

                    break;

                }

            }

            //------------------------------------------------
            // Subcounties
            //------------------------------------------------

            for (const place of this.subcounties) {

                if (question.includes(place)) {

                    entities.subcounties!.push(place);

                }

            }

            //------------------------------------------------
            // Season
            //------------------------------------------------

            for (const season of this.seasons) {

                if (question.includes(season)) {

                    entities.season = season;

                    break;

                }

            }

            //------------------------------------------------
            // Fertilizer
            //------------------------------------------------

            for (const fert of this.fertilizers) {

                if (question.includes(fert)) {

                    entities.fertilizer = fert;

                    break;

                }

            }

            //------------------------------------------------
            // Year
            //------------------------------------------------

            const yearMatch =
                question.match(/\b20\d{2}\b/);

            if (yearMatch) {

                entities.year =
                    parseInt(yearMatch[0]);

            }

            //------------------------------------------------
            // Metric
            //------------------------------------------------

            if (question.includes("production"))

                entities.metric = "production";

            else if (question.includes("acre"))

                entities.metric = "acres";

            else if (question.includes("yield"))

                entities.metric = "yield";

            else if (question.includes("price"))

                entities.metric = "price";

            else if (question.includes("value"))

                entities.metric = "market_value";

            else if (question.includes("farmer"))

                entities.metric = "farmers";

            else if (question.includes("officer"))

                entities.metric = "extension_officers";

            //------------------------------------------------
            // Comparison
            //------------------------------------------------

            entities.comparison =

                question.includes("compare") ||

                question.includes("combined") ||

                question.includes("versus") ||

                question.includes("vs");

            //------------------------------------------------

            return this.success(

                entities,

                0.99

            );

        }

        catch (error: any) {

            return this.failure(error.message);

        }

    }

}
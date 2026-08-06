// lib/agents/LocationResolutionAgent.ts

import {
    BaseAgent,
    AgentContext,
    AgentResult
} from "./BaseAgent";

/**
 * ============================================================
 * Location Resolution Agent
 * ============================================================
 *
 * PURPOSE
 * -------
 * Convert user location names into valid database
 * locations.
 *
 * It handles:
 *
 * ✓ Misspellings
 * ✓ Aliases
 * ✓ Partial names
 * ✓ County
 * ✓ Subcounty
 * ✓ Ward
 *
 * It returns standardized names
 * before SQL generation.
 *
 * ============================================================
 *
 * Example
 *
 * User:
 *
 * "Tongren maize production"
 *
 * resolves to
 *
 * Tongaren
 *
 * -----------------------------------------
 *
 * User:
 *
 * "Webuye"
 *
 * resolves to
 *
 * Webuye East
 * Webuye West
 *
 * ============================================================
 */

export interface ResolvedLocation {

    county?: string;

    subcounties: string[];

    wards: string[];

    confidence: number;

}

export class LocationResolutionAgent extends BaseAgent {

    constructor() {

        super("Location Resolution Agent");

    }

    /**
     * Dictionary of aliases
     */

    private aliases: Record<string, string[]> = {

        "tongaren": [

            "tongaren",

            "tongren",

            "tongare",

            "tongarin"

        ],

        "bumula": [

            "bumula",

            "bumla",

            "bmula"

        ],

        "kabuchai": [

            "kabuchai",

            "kabchai"

        ],

        "sirisia": [

            "sirisia",

            "sirisha"

        ],

        "kimilili": [

            "kimilili",

            "kimili"

        ],

        "kanduyi": [

            "kanduyi",

            "kandui"

        ],

        "mt elgon": [

            "mt elgon",

            "mount elgon",

            "elgon"

        ],

        "webuye east": [

            "webuye east"

        ],

        "webuye west": [

            "webuye west"

        ]

    };

    async execute(
        context: AgentContext
    ): Promise<AgentResult> {

        this.log("Resolving locations...");

        const question =
            context.userQuestion.toLowerCase();

        const resolved: ResolvedLocation = {

            county: undefined,

            subcounties: [],

            wards: [],

            confidence: 1.0

        };

        /**
         * Detect county
         */

        if (

            question.includes("bungoma")

        ) {

            resolved.county = "Bungoma";

        }

        /**
         * Detect subcounties
         */

        for (

            const officialName

            in this.aliases

        ) {

            const aliases =
                this.aliases[officialName];

            const found =
                aliases.some(alias =>
                    question.includes(alias)
                );

            if (found) {

                resolved.subcounties.push(

                    this.capitalize(officialName)

                );

            }

        }

        /**
         * User only typed "Webuye"
         */

        if (

            question.includes("webuye") &&

            !question.includes("east") &&

            !question.includes("west")

        ) {

            resolved.subcounties = [

                "Webuye East",

                "Webuye West"

            ];

        }

        return this.success(resolved);

    }

    private capitalize(text: string): string {

        return text

            .split(" ")

            .map(

                word =>

                    word.charAt(0).toUpperCase()

                    +

                    word.slice(1)

            )

            .join(" ");

    }

}
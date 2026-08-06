// lib/agents/SchemaAgent.ts

import { BaseAgent, AgentContext, AgentResult } from "./BaseAgent";

/**
 * ============================================================
 * SchemaAgent
 * ============================================================
 *
 * Purpose
 * -------
 * Understands the PostgreSQL database structure.
 *
 * It knows:
 *
 * • Tables
 * • Columns
 * • Primary Keys
 * • Foreign Keys
 * • Relationships
 *
 * It does NOT generate SQL.
 * It only tells later agents where data lives.
 *
 * Example
 * -------
 *
 * User:
 * "What was maize production in Bumula?"
 *
 * SchemaAgent identifies:
 *
 * crop_production
 * location
 *
 * and their relationships.
 *
 * ============================================================
 */

export interface ColumnInfo {

    name: string;

    type: string;

    description: string;

}

export interface TableInfo {

    name: string;

    description: string;

    primaryKey: string;

    columns: ColumnInfo[];

}

export interface RelationshipInfo {

    fromTable: string;

    fromColumn: string;

    toTable: string;

    toColumn: string;

}

export class SchemaAgent extends BaseAgent {

    constructor() {

        super("Schema Agent");

    }

    /**
     * Static schema knowledge.
     * Later this can be loaded automatically
     * from PostgreSQL INFORMATION_SCHEMA.
     */

    private readonly tables: TableInfo[] = [

        {

            name: "crop_production",

            description:
                "Stores crop production statistics.",

            primaryKey: "production_id",

            columns: [

                {
                    name: "production_id",
                    type: "UUID",
                    description: "Primary Key"
                },

                {
                    name: "crop_id",
                    type: "UUID",
                    description: "Crop"
                },

                {
                    name: "location_id",
                    type: "UUID",
                    description: "Location"
                },

                {
                    name: "season_id",
                    type: "UUID",
                    description: "Season"
                },

                {
                    name: "year",
                    type: "INTEGER",
                    description: "Production Year"
                },

                {
                    name: "target_acres",
                    type: "NUMERIC",
                    description: "Target acres"
                },

                {
                    name: "achieved_acres",
                    type: "NUMERIC",
                    description: "Achieved acres"
                },

                {
                    name: "target_production_kg",
                    type: "NUMERIC",
                    description: "Target production"
                },

                {
                    name: "achieved_production_kg",
                    type: "NUMERIC",
                    description: "Actual production"
                },

                {
                    name: "price_per_kg",
                    type: "NUMERIC",
                    description: "Selling price"
                }

            ]

        },

        {

            name: "locations",

            description:
                "County, Subcounty and Ward hierarchy.",

            primaryKey: "location_id",

            columns: [

                {
                    name: "location_id",
                    type: "UUID",
                    description: "Primary Key"
                },

                {
                    name: "county",
                    type: "TEXT",
                    description: "County"
                },

                {
                    name: "subcounty",
                    type: "TEXT",
                    description: "Subcounty"
                },

                {
                    name: "ward",
                    type: "TEXT",
                    description: "Ward"
                }

            ]

        },

        {

            name: "crops",

            description:
                "Master crop table.",

            primaryKey: "crop_id",

            columns: [

                {
                    name: "crop_id",
                    type: "UUID",
                    description: "Primary Key"
                },

                {
                    name: "crop_name",
                    type: "TEXT",
                    description: "Crop name"
                }

            ]

        },

        {

            name: "seasons",

            description:
                "Production seasons.",

            primaryKey: "season_id",

            columns: [

                {
                    name: "season_id",
                    type: "UUID",
                    description: "Primary Key"
                },

                {
                    name: "season_name",
                    type: "TEXT",
                    description: "Long Rain / Short Rain"
                }

            ]

        }

    ];

    /**
     * Table relationships.
     */

    private readonly relationships: RelationshipInfo[] = [

        {

            fromTable: "crop_production",

            fromColumn: "crop_id",

            toTable: "crops",

            toColumn: "crop_id"

        },

        {

            fromTable: "crop_production",

            fromColumn: "location_id",

            toTable: "locations",

            toColumn: "location_id"

        },

        {

            fromTable: "crop_production",

            fromColumn: "season_id",

            toTable: "seasons",

            toColumn: "season_id"

        }

    ];

    async execute(
        context: AgentContext
    ): Promise<AgentResult> {

        this.log("Loading database schema...");

        return this.success({

            tables: this.tables,

            relationships: this.relationships

        });

    }

}
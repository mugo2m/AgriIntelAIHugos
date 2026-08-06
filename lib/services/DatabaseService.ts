// ==========================================================
// File: lib/services/DatabaseService.ts
// Purpose:
// PostgreSQL Database Service
// Executes parameterized SQL safely using Prisma
// ==========================================================

import { PrismaClient } from "@prisma/client";

export interface QueryResult<T = any> {

    success: boolean;

    rows: T[];

    rowCount: number;

    executionTime: number;

    error?: string;

}

export class DatabaseService {

    //------------------------------------------------------
    // Prisma Client (Singleton)
    //------------------------------------------------------

    private static prisma = new PrismaClient({

        log: [

            "query",

            "warn",

            "error"

        ]

    });

    //------------------------------------------------------
    // Check Database Connection
    //------------------------------------------------------

    async connect(): Promise<boolean> {

        try {

            await DatabaseService.prisma.$connect();

            console.log("✅ PostgreSQL Connected");

            return true;

        }

        catch (error) {

            console.error(error);

            return false;

        }

    }

    //------------------------------------------------------
    // Disconnect
    //------------------------------------------------------

    async disconnect() {

        await DatabaseService.prisma.$disconnect();

    }

    //------------------------------------------------------
    // Execute SELECT Query
    //------------------------------------------------------

    async executeQuery<T = any>(

        sql: string,

        parameters: any[] = []

    ): Promise<QueryResult<T>> {

        const start = Date.now();

        try {

            const rows =

                await DatabaseService.prisma.$queryRawUnsafe<T[]>(

                    sql,

                    ...parameters

                );

            return {

                success: true,

                rows,

                rowCount: rows.length,

                executionTime:

                    Date.now() - start

            };

        }

        catch (error: any) {

            console.error(error);

            return {

                success: false,

                rows: [],

                rowCount: 0,

                executionTime:

                    Date.now() - start,

                error: error.message

            };

        }

    }

    //------------------------------------------------------
    // Execute INSERT UPDATE DELETE
    //------------------------------------------------------

    async executeCommand(

        sql: string,

        parameters: any[] = []

    ) {

        const start = Date.now();

        try {

            const affected =

                await DatabaseService.prisma.$executeRawUnsafe(

                    sql,

                    ...parameters

                );

            return {

                success: true,

                affectedRows: affected,

                executionTime:

                    Date.now() - start

            };

        }

        catch (error: any) {

            console.error(error);

            return {

                success: false,

                affectedRows: 0,

                executionTime:

                    Date.now() - start,

                error: error.message

            };

        }

    }

    //------------------------------------------------------
    // Transaction
    //------------------------------------------------------

    async transaction(

        callback: (tx: PrismaClient) => Promise<any>

    ) {

        return DatabaseService.prisma.$transaction(

            async (tx) => {

                return callback(

                    tx as PrismaClient

                );

            }

        );

    }

    //------------------------------------------------------
    // Health Check
    //------------------------------------------------------

    async health() {

        try {

            await DatabaseService.prisma.$queryRaw`

                SELECT 1

            `;

            return {

                status: "Healthy",

                database: "PostgreSQL",

                timestamp: new Date()

            };

        }

        catch {

            return {

                status: "Offline",

                database: "PostgreSQL",

                timestamp: new Date()

            };

        }

    }

    //------------------------------------------------------
    // List Tables
    //------------------------------------------------------

    async getTables() {

        const sql = `

        SELECT

            table_name

        FROM

            information_schema.tables

        WHERE

            table_schema='public'

        ORDER BY

            table_name

        `;

        return this.executeQuery(sql);

    }

    //------------------------------------------------------
    // Describe Table
    //------------------------------------------------------

    async describeTable(

        table: string

    ) {

        const sql = `

        SELECT

            column_name,

            data_type,

            is_nullable

        FROM

            information_schema.columns

        WHERE

            table_name=$1

        ORDER BY

            ordinal_position

        `;

        return this.executeQuery(

            sql,

            [table]

        );

    }

    //------------------------------------------------------
    // Count Records
    //------------------------------------------------------

    async count(

        table: string

    ) {

        const sql = `

        SELECT COUNT(*) AS total

        FROM ${table}

        `;

        return this.executeQuery(sql);

    }

}
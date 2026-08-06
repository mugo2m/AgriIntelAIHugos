// =============================================================
// File: lib/agents/AnalyticalMemoryAgent.ts
// Purpose:
// Stores analytical history, generated reports,
// SQL queries, charts and statistics for future comparison.
// =============================================================

import { BaseAgent } from "./BaseAgent";

export interface AnalysisRecord {

    id: string;

    timestamp: Date;

    question: string;

    sql: string;

    entities: any;

    filters: any;

    metrics: any;

    results: any[];

    insights: string[];

    recommendations: string[];

    charts?: any[];

    report?: any;

}

export class AnalyticalMemoryAgent extends BaseAgent {

    private history: AnalysisRecord[] = [];

    constructor() {

        super("Analytical Memory Agent");

    }

    //--------------------------------------------------------
    // Save Analysis
    //--------------------------------------------------------

    save(record: AnalysisRecord): void {

        this.history.push(record);

        this.log(
            `Analysis stored: ${record.id}`
        );

    }

    //--------------------------------------------------------
    // Get All Analyses
    //--------------------------------------------------------

    getHistory(): AnalysisRecord[] {

        return this.history;

    }

    //--------------------------------------------------------
    // Get Latest Analysis
    //--------------------------------------------------------

    getLatest(): AnalysisRecord | undefined {

        if (this.history.length === 0) {

            return undefined;

        }

        return this.history[
            this.history.length - 1
        ];

    }

    //--------------------------------------------------------
    // Find by ID
    //--------------------------------------------------------

    findById(
        id: string
    ): AnalysisRecord | undefined {

        return this.history.find(

            record => record.id === id

        );

    }

    //--------------------------------------------------------
    // Search by Question
    //--------------------------------------------------------

    search(
        keyword: string
    ): AnalysisRecord[] {

        const term = keyword.toLowerCase();

        return this.history.filter(

            record =>

                record.question
                    .toLowerCase()
                    .includes(term)

        );

    }

    //--------------------------------------------------------
    // Search by Crop
    //--------------------------------------------------------

    searchByCrop(
        crop: string
    ): AnalysisRecord[] {

        return this.history.filter(

            record =>

                record.entities?.crop === crop

        );

    }

    //--------------------------------------------------------
    // Search by Year
    //--------------------------------------------------------

    searchByYear(
        year: number
    ): AnalysisRecord[] {

        return this.history.filter(

            record =>

                record.filters?.year === year

        );

    }

    //--------------------------------------------------------
    // Search by County
    //--------------------------------------------------------

    searchByCounty(
        county: string
    ): AnalysisRecord[] {

        return this.history.filter(

            record =>

                record.entities?.county === county

        );

    }

    //--------------------------------------------------------
    // Compare Two Reports
    //--------------------------------------------------------

    compare(
        firstId: string,
        secondId: string
    ) {

        const first =
            this.findById(firstId);

        const second =
            this.findById(secondId);

        if (!first || !second) {

            return null;

        }

        return {

            first,

            second

        };

    }

    //--------------------------------------------------------
    // Remove One Record
    //--------------------------------------------------------

    delete(
        id: string
    ): void {

        this.history = this.history.filter(

            record => record.id !== id

        );

    }

    //--------------------------------------------------------
    // Clear History
    //--------------------------------------------------------

    clear(): void {

        this.history = [];

        this.log(
            "Analytical history cleared."
        );

    }

    //--------------------------------------------------------
    // Return Entire Memory
    //--------------------------------------------------------

    async execute(): Promise<AnalysisRecord[]> {

        this.log(
            "Loading analytical memory..."
        );

        return this.history;

    }

}
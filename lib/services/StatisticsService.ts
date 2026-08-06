// ==========================================================
// File: lib/services/StatisticsService.ts
// Purpose:
// Collects, calculates and reports statistics about the
// SQL Analytics System.
// ==========================================================

export interface SystemStatistics {

    totalQuestions: number;

    successfulQueries: number;

    failedQueries: number;

    averageExecutionTime: number;

    averageRowsReturned: number;

    totalRowsReturned: number;

    cacheHits: number;

    cacheMisses: number;

    mostRequestedCrop?: string;

    mostRequestedCounty?: string;

    mostRequestedSeason?: string;

    uptime: number;

}

export interface QueryStatistic {

    timestamp: Date;

    executionTime: number;

    rowsReturned: number;

    crop?: string;

    county?: string;

    season?: string;

    success: boolean;

}

export class StatisticsService {

    //----------------------------------------------------
    // System Start Time
    //----------------------------------------------------

    private readonly startedAt = Date.now();

    //----------------------------------------------------
    // Query History
    //----------------------------------------------------

    private history: QueryStatistic[] = [];

    //----------------------------------------------------
    // Cache Statistics
    //----------------------------------------------------

    private cacheHits = 0;

    private cacheMisses = 0;

    //----------------------------------------------------
    // Record Query
    //----------------------------------------------------

    recordQuery(

        statistic: QueryStatistic

    ): void {

        this.history.push(statistic);

    }

    //----------------------------------------------------
    // Cache Hit
    //----------------------------------------------------

    recordCacheHit(): void {

        this.cacheHits++;

    }

    //----------------------------------------------------
    // Cache Miss
    //----------------------------------------------------

    recordCacheMiss(): void {

        this.cacheMisses++;

    }

    //----------------------------------------------------
    // Successful Queries
    //----------------------------------------------------

    getSuccessfulQueries() {

        return this.history.filter(

            query => query.success

        );

    }

    //----------------------------------------------------
    // Failed Queries
    //----------------------------------------------------

    getFailedQueries() {

        return this.history.filter(

            query => !query.success

        );

    }

    //----------------------------------------------------
    // Average Execution Time
    //----------------------------------------------------

    getAverageExecutionTime() {

        if (this.history.length === 0)

            return 0;

        const total =

            this.history.reduce(

                (sum, query) =>

                    sum +

                    query.executionTime,

                0

            );

        return total / this.history.length;

    }

    //----------------------------------------------------
    // Average Rows
    //----------------------------------------------------

    getAverageRowsReturned() {

        if (this.history.length === 0)

            return 0;

        const total =

            this.history.reduce(

                (sum, query) =>

                    sum +

                    query.rowsReturned,

                0

            );

        return total / this.history.length;

    }

    //----------------------------------------------------
    // Most Requested Value
    //----------------------------------------------------

    private mostCommon(

        values: (string | undefined)[]

    ) {

        const frequency:

            Record<string, number> = {};

        values.forEach(value => {

            if (!value) return;

            frequency[value] =

                (frequency[value] || 0) + 1;

        });

        let winner = "";

        let highest = 0;

        for (const key in frequency) {

            if (

                frequency[key] > highest

            ) {

                highest = frequency[key];

                winner = key;

            }

        }

        return winner || undefined;

    }

    //----------------------------------------------------
    // Build Statistics
    //----------------------------------------------------

    getStatistics(): SystemStatistics {

        return {

            totalQuestions:

                this.history.length,

            successfulQueries:

                this.getSuccessfulQueries()

                .length,

            failedQueries:

                this.getFailedQueries()

                .length,

            averageExecutionTime:

                this.getAverageExecutionTime(),

            averageRowsReturned:

                this.getAverageRowsReturned(),

            totalRowsReturned:

                this.history.reduce(

                    (sum, q) =>

                        sum +

                        q.rowsReturned,

                    0

                ),

            cacheHits:

                this.cacheHits,

            cacheMisses:

                this.cacheMisses,

            mostRequestedCrop:

                this.mostCommon(

                    this.history.map(

                        h => h.crop

                    )

                ),

            mostRequestedCounty:

                this.mostCommon(

                    this.history.map(

                        h => h.county

                    )

                ),

            mostRequestedSeason:

                this.mostCommon(

                    this.history.map(

                        h => h.season

                    )

                ),

            uptime:

                Date.now() -

                this.startedAt

        };

    }

    //----------------------------------------------------
    // Dashboard Summary
    //----------------------------------------------------

    dashboard() {

        const stats =

            this.getStatistics();

        return {

            systemStatus: "Healthy",

            uptimeHours:

                Number(

                    (

                        stats.uptime /

                        3600000

                    ).toFixed(2)

                ),

            totalQuestions:

                stats.totalQuestions,

            successRate:

                stats.totalQuestions === 0

                ? 0

                : Number(

                    (

                        stats.successfulQueries *

                        100 /

                        stats.totalQuestions

                    ).toFixed(2)

                ),

            averageExecutionTime:

                Number(

                    stats.averageExecutionTime

                    .toFixed(2)

                ),

            cacheEfficiency:

                stats.cacheHits +

                stats.cacheMisses === 0

                ? 0

                : Number(

                    (

                        stats.cacheHits *

                        100 /

                        (

                            stats.cacheHits +

                            stats.cacheMisses

                        )

                    ).toFixed(2)

                ),

            mostRequestedCrop:

                stats.mostRequestedCrop,

            mostRequestedCounty:

                stats.mostRequestedCounty,

            mostRequestedSeason:

                stats.mostRequestedSeason

        };

    }

    //----------------------------------------------------
    // Reset Statistics
    //----------------------------------------------------

    reset() {

        this.history = [];

        this.cacheHits = 0;

        this.cacheMisses = 0;

    }

}
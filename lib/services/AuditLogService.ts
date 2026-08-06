// ==========================================================
// File: lib/services/AuditLogService.ts
// Purpose:
// Records every activity performed by the SQL Analytics
// System for auditing, debugging and security.
// ==========================================================

export interface AuditLog {

    id: string;

    timestamp: Date;

    userId?: string;

    sessionId?: string;

    question: string;

    rewrittenQuestion?: string;

    intent?: string;

    entities?: any;

    filters?: any;

    metrics?: any;

    generatedSQL?: string;

    executionTime?: number;

    rowsReturned?: number;

    success: boolean;

    error?: string;

    ipAddress?: string;

    userAgent?: string;

}

export class AuditLogService {

    //------------------------------------------------------
    // In-memory audit logs
    //------------------------------------------------------

    private logs: AuditLog[] = [];

    //------------------------------------------------------
    // Write Audit Log
    //------------------------------------------------------

    log(entry: AuditLog): void {

        this.logs.push(entry);

        console.log("Audit Log Saved");

    }

    //------------------------------------------------------
    // Retrieve All Logs
    //------------------------------------------------------

    getAll(): AuditLog[] {

        return this.logs;

    }

    //------------------------------------------------------
    // Get Log By ID
    //------------------------------------------------------

    getById(

        id: string

    ): AuditLog | undefined {

        return this.logs.find(

            log => log.id === id

        );

    }

    //------------------------------------------------------
    // Get Logs By User
    //------------------------------------------------------

    getByUser(

        userId: string

    ): AuditLog[] {

        return this.logs.filter(

            log => log.userId === userId

        );

    }

    //------------------------------------------------------
    // Get Logs By Session
    //------------------------------------------------------

    getBySession(

        sessionId: string

    ): AuditLog[] {

        return this.logs.filter(

            log => log.sessionId === sessionId

        );

    }

    //------------------------------------------------------
    // Search By Keyword
    //------------------------------------------------------

    search(

        keyword: string

    ): AuditLog[] {

        const term = keyword.toLowerCase();

        return this.logs.filter(

            log =>

                log.question

                    .toLowerCase()

                    .includes(term)

        );

    }

    //------------------------------------------------------
    // Failed Queries
    //------------------------------------------------------

    failedQueries(): AuditLog[] {

        return this.logs.filter(

            log => !log.success

        );

    }

    //------------------------------------------------------
    // Successful Queries
    //------------------------------------------------------

    successfulQueries(): AuditLog[] {

        return this.logs.filter(

            log => log.success

        );

    }

    //------------------------------------------------------
    // Delete Log
    //------------------------------------------------------

    delete(

        id: string

    ): void {

        this.logs =

            this.logs.filter(

                log => log.id !== id

            );

    }

    //------------------------------------------------------
    // Clear Logs
    //------------------------------------------------------

    clear(): void {

        this.logs = [];

    }

    //------------------------------------------------------
    // Statistics
    //------------------------------------------------------

    statistics() {

        const successful =

            this.successfulQueries().length;

        const failed =

            this.failedQueries().length;

        const total =

            this.logs.length;

        const averageExecutionTime =

            total === 0

                ? 0

                : this.logs.reduce(

                    (sum, log) =>

                        sum +

                        (log.executionTime ?? 0),

                    0

                  ) / total;

        return {

            totalQueries: total,

            successfulQueries: successful,

            failedQueries: failed,

            averageExecutionTime

        };

    }

    //------------------------------------------------------
    // Export Logs
    //------------------------------------------------------

    export(): AuditLog[] {

        return [...this.logs];

    }

}
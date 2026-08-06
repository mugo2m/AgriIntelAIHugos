// =========================================================
// File: lib/agents/SessionMemoryAgent.ts
// Purpose:
// Stores temporary information for the current session only.
// The memory is cleared when the user starts a new session.
// =========================================================

import { BaseAgent } from "./BaseAgent";

export interface SessionMemory {

    sessionId?: string;

    crop?: string;

    variety?: string;

    county?: string;

    subCounty?: string;

    ward?: string;

    season?: string;

    year?: number;

    metric?: string;

    chartType?: string;

    sql?: string;

    lastResult?: any;

    metadata?: Record<string, any>;

}

export class SessionMemoryAgent extends BaseAgent {

    private session: SessionMemory = {};

    constructor() {

        super("Session Memory Agent");

    }

    //-------------------------------------------------------
    // Start New Session
    //-------------------------------------------------------

    startSession(sessionId: string): void {

        this.session = {

            sessionId

        };

        this.log(`Session started: ${sessionId}`);

    }

    //-------------------------------------------------------
    // Save Session Values
    //-------------------------------------------------------

    save(memory: Partial<SessionMemory>): void {

        this.session = {

            ...this.session,

            ...memory

        };

    }

    //-------------------------------------------------------
    // Retrieve Entire Session
    //-------------------------------------------------------

    getSession(): SessionMemory {

        return this.session;

    }

    //-------------------------------------------------------
    // Retrieve Individual Value
    //-------------------------------------------------------

    get<K extends keyof SessionMemory>(
        key: K
    ): SessionMemory[K] {

        return this.session[key];

    }

    //-------------------------------------------------------
    // Update Individual Value
    //-------------------------------------------------------

    update<K extends keyof SessionMemory>(
        key: K,
        value: SessionMemory[K]
    ): void {

        this.session[key] = value;

    }

    //-------------------------------------------------------
    // Remove Individual Value
    //-------------------------------------------------------

    remove<K extends keyof SessionMemory>(
        key: K
    ): void {

        delete this.session[key];

    }

    //-------------------------------------------------------
    // End Session
    //-------------------------------------------------------

    clear(): void {

        this.log("Session memory cleared.");

        this.session = {};

    }

    //-------------------------------------------------------
    // Return Current Session
    //-------------------------------------------------------

    async execute(): Promise<SessionMemory> {

        this.log("Loading session memory...");

        return this.session;

    }

}
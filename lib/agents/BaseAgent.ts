/**
 * ================================================================
 * BaseAgent
 * ================================================================
 *
 * Every agent in the SQL Analytics platform extends this class.
 *
 * Responsibilities
 * ----------------
 * • Provides a common interface.
 * • Standardizes success/failure responses.
 * • Stores agent metadata.
 * • Provides logging helpers.
 * • Makes every agent plug-and-play.
 *
 * Workflow
 *
 * User
 *   │
 *   ▼
 * BaseAgent
 *   │
 *   ├── ContextAgent
 *   ├── IntentDetectionAgent
 *   ├── EntityExtractionAgent
 *   ├── SQLGenerationAgent
 *   ├── ...
 *
 * ================================================================
 */

export interface AgentContext {

    /**
     * Original user question.
     */

    question: string;

    /**
     * Previous conversation history.
     */

    history?: string[];

    /**
     * Shared memory between agents.
     */

    memory?: Record<string, any>;

    /**
     * Extracted entities.
     */

    entities?: any;

    /**
     * Generated SQL.
     */

    sql?: string;

    /**
     * SQL results.
     */

    results?: any[];

}

export interface AgentResult<T = any> {

    success: boolean;

    confidence: number;

    data?: T;

    error?: string;

}

export abstract class BaseAgent {

    protected readonly agentName: string;

    constructor(agentName: string) {

        this.agentName = agentName;

    }

    /**
     * Main method every agent must implement.
     */

    abstract execute(
        context: AgentContext
    ): Promise<AgentResult>;

    /**
     * Success helper.
     */

    protected success<T>(
        data: T,
        confidence = 1.0
    ): AgentResult<T> {

        return {

            success: true,

            confidence,

            data

        };

    }

    /**
     * Failure helper.
     */

    protected failure(
        error: string
    ): AgentResult {

        return {

            success: false,

            confidence: 0,

            error

        };

    }

    /**
     * Standard logger.
     */

    protected log(message: string): void {

        console.log(

            `[${this.agentName}] ${message}`

        );

    }

    /**
     * Lowercase + trim utility.
     */

    protected normalize(text: string): string {

        return text

            .trim()

            .toLowerCase();

    }

}
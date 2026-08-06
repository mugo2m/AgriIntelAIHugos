// ==========================================================
// File: lib/services/QueryCacheService.ts
// Purpose:
// Intelligent cache for SQL Analytics queries.
// Prevents repeated SQL execution for identical questions.
// ==========================================================

export interface CacheEntry {

    id: string;

    question: string;

    sql: string;

    response: any;

    createdAt: Date;

    expiresAt: Date;

    hitCount: number;

}

export class QueryCacheService {

    //------------------------------------------------------
    // In-Memory Cache
    //------------------------------------------------------

    private cache = new Map<string, CacheEntry>();

    //------------------------------------------------------
    // Default TTL
    //------------------------------------------------------

    private readonly DEFAULT_TTL = 1000 * 60 * 30;

    //------------------------------------------------------
    // Generate Cache Key
    //------------------------------------------------------

    private generateKey(

        question: string

    ): string {

        return question

            .trim()

            .toLowerCase()

            .replace(/\s+/g, " ");

    }

    //------------------------------------------------------
    // Store Cache
    //------------------------------------------------------

    save(

        question: string,

        sql: string,

        response: any,

        ttl: number = this.DEFAULT_TTL

    ) {

        const key = this.generateKey(question);

        this.cache.set(key, {

            id: crypto.randomUUID(),

            question,

            sql,

            response,

            createdAt: new Date(),

            expiresAt: new Date(

                Date.now() + ttl

            ),

            hitCount: 0

        });

    }

    //------------------------------------------------------
    // Retrieve Cache
    //------------------------------------------------------

    get(

        question: string

    ): CacheEntry | null {

        const key = this.generateKey(question);

        const item = this.cache.get(key);

        if (!item) {

            return null;

        }

        //--------------------------------------------------
        // Expired
        //--------------------------------------------------

        if (

            new Date() >

            item.expiresAt

        ) {

            this.cache.delete(key);

            return null;

        }

        item.hitCount++;

        return item;

    }

    //------------------------------------------------------
    // Cache Exists?
    //------------------------------------------------------

    has(

        question: string

    ): boolean {

        return this.get(question) !== null;

    }

    //------------------------------------------------------
    // Remove One Cache
    //------------------------------------------------------

    remove(

        question: string

    ) {

        const key = this.generateKey(question);

        this.cache.delete(key);

    }

    //------------------------------------------------------
    // Clear Entire Cache
    //------------------------------------------------------

    clear() {

        this.cache.clear();

    }

    //------------------------------------------------------
    // Remove Expired Entries
    //------------------------------------------------------

    cleanup() {

        const now = new Date();

        for (

            const [key, value]

            of this.cache

        ) {

            if (

                now > value.expiresAt

            ) {

                this.cache.delete(key);

            }

        }

    }

    //------------------------------------------------------
    // Statistics
    //------------------------------------------------------

    stats() {

        let totalHits = 0;

        for (

            const item

            of this.cache.values()

        ) {

            totalHits += item.hitCount;

        }

        return {

            cacheSize:

                this.cache.size,

            totalHits,

            entries:

                Array.from(

                    this.cache.values()

                )

        };

    }

    //------------------------------------------------------
    // Return Entire Cache
    //------------------------------------------------------

    list() {

        return Array.from(

            this.cache.values()

        );

    }

}
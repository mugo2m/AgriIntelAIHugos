// =========================================================
// File: lib/agents/UserPreferenceMemoryAgent.ts
// Purpose:
// Stores and manages long-term user preferences.
// These preferences persist across conversations.
// =========================================================

import { BaseAgent } from "./BaseAgent";

export interface UserPreferences {

    language?: string;

    country?: string;

    county?: string;

    preferredCrop?: string;

    preferredSeason?: string;

    preferredCurrency?: string;

    preferredAreaUnit?: string;

    preferredYieldUnit?: string;

    preferredChart?: string;

    theme?: "light" | "dark";

    notifications?: boolean;

}

export class UserPreferenceMemoryAgent extends BaseAgent {

    private preferences: UserPreferences = {};

    constructor() {

        super("User Preference Memory Agent");

    }

    //------------------------------------------------------
    // Save Preferences
    //------------------------------------------------------

    save(preferences: Partial<UserPreferences>): void {

        this.preferences = {

            ...this.preferences,

            ...preferences

        };

        this.log("User preferences updated.");

    }

    //------------------------------------------------------
    // Retrieve All Preferences
    //------------------------------------------------------

    getPreferences(): UserPreferences {

        return this.preferences;

    }

    //------------------------------------------------------
    // Retrieve Individual Preference
    //------------------------------------------------------

    get<K extends keyof UserPreferences>(
        key: K
    ): UserPreferences[K] {

        return this.preferences[key];

    }

    //------------------------------------------------------
    // Update Single Preference
    //------------------------------------------------------

    update<K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ): void {

        this.preferences[key] = value;

        this.log(`Preference '${String(key)}' updated.`);

    }

    //------------------------------------------------------
    // Remove Preference
    //------------------------------------------------------

    remove<K extends keyof UserPreferences>(
        key: K
    ): void {

        delete this.preferences[key];

    }

    //------------------------------------------------------
    // Reset Preferences
    //------------------------------------------------------

    clear(): void {

        this.preferences = {};

        this.log("User preferences cleared.");

    }

    //------------------------------------------------------
    // Apply Default Preferences
    //------------------------------------------------------

    async execute(): Promise<UserPreferences> {

        this.log("Loading user preferences...");

        return {

            language:
                this.preferences.language ?? "English",

            country:
                this.preferences.country ?? "Kenya",

            county:
                this.preferences.county,

            preferredCrop:
                this.preferences.preferredCrop,

            preferredSeason:
                this.preferences.preferredSeason,

            preferredCurrency:
                this.preferences.preferredCurrency ?? "KSh",

            preferredAreaUnit:
                this.preferences.preferredAreaUnit ?? "Acres",

            preferredYieldUnit:
                this.preferences.preferredYieldUnit ?? "Kilograms",

            preferredChart:
                this.preferences.preferredChart ?? "Bar Chart",

            theme:
                this.preferences.theme ?? "light",

            notifications:
                this.preferences.notifications ?? true

        };

    }

}
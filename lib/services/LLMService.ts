// ==========================================================
// File: lib/services/LLMService.ts
// Purpose:
// Centralized Large Language Model Service
// ==========================================================

export interface LLMRequest {

    systemPrompt: string;

    userPrompt: string;

    temperature?: number;

    maxTokens?: number;

}

export interface LLMResponse {

    success: boolean;

    text: string;

    model: string;

    usage?: any;

}

export class LLMService {

    constructor() {}

    //--------------------------------------------------
    // Main Chat Method
    //--------------------------------------------------

    async chat(
        request: LLMRequest
    ): Promise<LLMResponse> {

        try {

            // TODO:
            // Replace this section with your preferred provider
            // Examples:
            // Gemini
            // OpenAI
            // Groq
            // Ollama
            // HuggingFace

            console.log("Calling LLM...");

            console.log(request.systemPrompt);

            console.log(request.userPrompt);

            //--------------------------------------------------

            const generatedText =
                "LLM Response Placeholder";

            return {

                success: true,

                text: generatedText,

                model: "Gemini"

            };

        }

        catch (error) {

            console.error(error);

            return {

                success: false,

                text: "",

                model: "Gemini"

            };

        }

    }

    //--------------------------------------------------
    // JSON Output
    //--------------------------------------------------

    async generateJSON(

        systemPrompt: string,

        userPrompt: string

    ) {

        const response =

            await this.chat({

                systemPrompt,

                userPrompt,

                temperature: 0

            });

        return JSON.parse(response.text);

    }

    //--------------------------------------------------
    // SQL Generation
    //--------------------------------------------------

    async generateSQL(

        prompt: string

    ) {

        return this.chat({

            systemPrompt:

                "You are an expert PostgreSQL SQL Generator.",

            userPrompt: prompt,

            temperature: 0

        });

    }

    //--------------------------------------------------
    // Natural Language Explanation
    //--------------------------------------------------

    async explain(

        prompt: string

    ) {

        return this.chat({

            systemPrompt:

                "You are an agricultural data analyst.",

            userPrompt: prompt,

            temperature: 0.2

        });

    }

}
import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';
import { TandSAnalyzer, CHAT_SYSTEM_PROMPT } from "./prompts";


// Initialize OpenRouter Client
const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
    defaultHeaders: {
        "HTTP-Referer": "https://Tounge.app",
        "X-Title": "Tounge",
    }
});

/**
 * 💡 WHY ARE FREE MODELS FAILING?
 * OpenRouter's :free models share a global daily quota across all users. 
 * When it says "429 Rate limit exceeded: free-models-per-day", it means the entire 
 * community has exhausted the free tokens for that specific model/provider.
 * 
 * Strategy: We use a wide "Model Rail" to failover across different providers 
 * (Google, Meta, Mistral, Qwen) to maximize chances of finding a free slot.
 */
const FREE_MODELS = [

    "upstage/solar-pro-3:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "allenai/molmo-2-8b:free",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.3-70b-instruct:free",
];

export function getAnalysisSystemPrompt(language: string) {
    return TandSAnalyzer;
}


/**
 * Robust AI Service using OpenRouter with Model Fallback.
 */
// Initialize Gemini Client (Official SDK)
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
}) : null;

/**
 * Robust AI Service:
 * 1. 🚀 Priority: Gemini Pro (User's Personal Key) - Reliable, Fast, High Limits.
 * 2. 🛡️ Fallback: OpenRouter (Community Free Tier) - Shared limits, might be 429'd.
 */
export async function askAI(message: string, contextCode?: string, systemPromptOverride?: string, onStatus?: (status: string) => void): Promise<string> {
    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    const userPrompt = contextCode ? `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${message}` : message;

    // --- 1. Try Gemini (If Configured) ---
    if (gemini) {
        try {
            console.log(`[AI Service] 💎 Using Gemini Native SDK...`);
            onStatus?.("Syncing with Tounge Neural Net (Gemini Pro)...");

            // Combine prompts for the simple GenerateContent API
            const combinedPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

            const response = await gemini.models.generateContent({
                model: "gemini-1.5-flash",
                contents: combinedPrompt,
            });

            // Handle potential variation in SDK response structure
            const text = response.text;

            if (text) {
                console.log(`[AI Service] ✅ Gemini Success`);
                onStatus?.("Neural Net handshake successful. Processing data...");
                return text;
            }
        } catch (error: unknown) {
            // Check for specific Gemini error properties
            const err = error instanceof Error ? error.message : String(error);
            const status = (error as any)?.status || (error as any)?.response?.status || 'Unknown Status';

            console.error(`[AI Service] ⚠️ Gemini Failed [${status}]: ${err}`);
            onStatus?.(`Gemini connection lost [${status}]. Rerouting...`);
        }
    }

    // --- 2. Fallback to OpenRouter ---
    if (!process.env.OPENROUTER_API_KEY) {
        // If neither key is present, we must fail
        if (!gemini) throw new Error("MISSING_API_KEYS: Please set GEMINI_API_KEY or OPENROUTER_API_KEY");
    }

    let lastErrorMessage = "All models returned empty response";
    onStatus?.("Engaging backup nodes (OpenRouter Swarm)...");

    for (const model of FREE_MODELS) {
        try {
            console.log(`[AI Service] 🤖 Attempting OpenRouter: ${model}...`);
            onStatus?.(`Routing request to node: ${model.split('/')[1]}...`);

            const completion = await openRouter.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                console.log(`[AI Service] ✅ Success with ${model}`);
                onStatus?.(`Node ${model.split('/')[1]} Responded. Finalizing...`);
                return content;
            }
        } catch (error: unknown) {
            // Extract the actual error message and status code from OpenRouter API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiError = (error as any).error?.message || (error as any).message || "Unknown error";
            const statusCode = (error as any).status || (error as any).response?.status || 'No Code';

            lastErrorMessage = `[${statusCode}] ${apiError}`;

            console.error(`[AI Service] ❌ ${model} Failed [${statusCode}]: ${apiError}`);
            // Don't clutter status UI with full error details, just retry message
            onStatus?.(`Node ${model.split('/')[1]} Unresponsive [${statusCode}]. Retrying...`);
            // Continue to next model...
        }
    }

    onStatus?.("All neural nodes exhausted.");

    // Provide a helpful hint in the final error
    if (lastErrorMessage.includes('429') || lastErrorMessage.includes('Rate limit')) {
        throw new Error(`Rate Limit Exceeded: OpenRouter free tier is busy. ${lastErrorMessage}`);
    }

    throw new Error(lastErrorMessage);
}

/**
 * Streamed AI Service with Fallback
 */
export async function* streamAI(message: string, contextCode?: string, systemPromptOverride?: string): AsyncGenerator<string, void, unknown> {
    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    const userPrompt = contextCode ? `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${message}` : message;
    const combinedPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

    // --- 1. Try Gemini (If Configured) ---
    if (gemini) {
        try {
            console.log(`[AI Stream] 💎 Using Gemini...`);

            const result = await gemini.models.generateContentStream({
                model: "gemini-1.5-flash",
                contents: combinedPrompt,
            });

            for await (const chunk of result) {
                // Handle different SDK versions where text might be a method or property
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const val = (chunk as any).text;
                const chunkText = typeof val === 'function' ? val.call(chunk) : val;

                if (chunkText) yield chunkText;
            }
            return;
        } catch (error: unknown) {
            console.error(`[AI Stream] ⚠️ Gemini Failed:`, error);
        }
    }

    // --- 2. Fallback to OpenRouter ---
    if (!process.env.OPENROUTER_API_KEY && !gemini) {
        throw new Error("MISSING_API_KEYS: Please set GEMINI_API_KEY or OPENROUTER_API_KEY");
    }

    let lastErrorMessage = "All models returned empty response";

    for (const model of FREE_MODELS) {
        try {
            console.log(`[AI Stream] 🤖 Attempting OpenRouter: ${model}...`);

            const completion = await openRouter.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                stream: true,
            });

            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield content;
            }
            return;
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiError = (error as any).error?.message || (error as any).message || "Unknown error";
            lastErrorMessage = apiError;
            console.error(`[AI Stream] ❌ ${model} Failed:`, apiError);
        }
    }

    throw new Error(lastErrorMessage);
}

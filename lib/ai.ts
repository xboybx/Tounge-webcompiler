import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';

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
    "google/gemini-2.0-flash-exp:free",      // Google (Flash)
    "meta-llama/llama-3.3-70b-instruct:free", // Meta (Cloudflare/Together)
    "mistralai/mistral-small-3.1-24b-instruct:free", // Mistral
    "qwen/qwen2.5-72b-instruct:free",        // Qwen
    "deepseek/deepseek-chat:free",           // DeepSeek
    "microsoft/phi-3-medium-128k-instruct:free" // Microsoft
];

export function getAnalysisSystemPrompt(language: string) {
    return `You are a Senior Algorithm Architect and DSA Specialist. 
    Task: Exhaustively analyze the ${language} code for Time and Space complexity.
    
    Format: Return ONLY a valid JSON object.
    Schema:
    {
      "language": "${language}",
      "time": "O(...)",
      "space": "O(...)",
      "explanation": "Expert-level breakdown of complexity.",
      "suggestions": ["Tip 1", "Tip 2"]
    }

    Rules: Avoid conversational filler. Just the JSON.`;
}

const CHAT_SYSTEM_PROMPT = `You are Code Craft AI assistant. Provide concise, accurate responses with Markdown.`;

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
export async function askAI(message: string, contextCode?: string, systemPromptOverride?: string): Promise<string> {
    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    const userPrompt = contextCode ? `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${message}` : message;

    // --- 1. Try Gemini (If Configured) ---
    if (gemini) {
        try {
            console.log(`[AI Service] 💎 Using Gemini Native SDK...`);

            // Combine prompts for the simple GenerateContent API
            const combinedPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

            const response = await gemini.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: combinedPrompt,
            });

            // Handle potential variation in SDK response structure
            const text = response.text;

            if (text) {
                console.log(`[AI Service] ✅ Gemini Success`);
                return text;
            }
        } catch (error: unknown) {
            console.error(`[AI Service] ⚠️ Gemini Failed (Falling back to OpenRouter): ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // --- 2. Fallback to OpenRouter ---
    if (!process.env.OPENROUTER_API_KEY) {
        // If neither key is present, we must fail
        if (!gemini) throw new Error("MISSING_API_KEYS: Please set GEMINI_API_KEY or OPENROUTER_API_KEY");
    }

    let lastErrorMessage = "All models returned empty response";

    for (const model of FREE_MODELS) {
        try {
            console.log(`[AI Service] 🤖 Attempting OpenRouter: ${model}...`);
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
                return content;
            }
        } catch (error: unknown) {
            // Extract the actual error message from OpenRouter API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiError = (error as any).error?.message || (error as any).message || "Unknown error";
            lastErrorMessage = apiError;

            console.error(`[AI Service] ❌ ${model} Failed: ${apiError}`);
            // Continue to next model...
        }
    }

    throw new Error(lastErrorMessage);
}

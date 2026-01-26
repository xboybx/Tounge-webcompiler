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
export async function askAI(message: string, contextCode?: string, systemPromptOverride?: string): Promise<string> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("MISSING_API_KEY");
    }

    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    let userPrompt = contextCode ? `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${message}` : message;

    let lastErrorMessage = "All models returned empty response";

    for (const model of FREE_MODELS) {
        try {
            console.log(`[AI Service] 🤖 Attempting: ${model}...`);
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
        } catch (error: any) {
            // Extract the actual error message from OpenRouter API
            const apiError = error.error?.message || error.message || "Unknown error";
            lastErrorMessage = apiError;

            console.error(`[AI Service] ❌ ${model} Failed: ${apiError}`);

            // If it's a 429, we definitely want to try the NEXT model in the list
            // which likely uses a different backend provider.
        }
    }

    // Instead of a generic error, we throw the actual last error we got from the API
    throw new Error(lastErrorMessage);
}

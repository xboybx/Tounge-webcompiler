import OpenAI from 'openai';
import { TandSAnalyzer, CHAT_SYSTEM_PROMPT } from "./prompts";


// Initialize OpenRouter Client
const openRouter = new OpenAI({
    baseURL: "https://api.clod.io/v1",
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
// const lmodels = [
//     "z-ai/glm-4.5-air:free",
//     "stepfun/step-3.5-flash:free",
//     "arcee-ai/trinity-large-preview:free",
// ];

const lmodels = [
    "GLM 4.5 Air",
    "Meta Llama 3.3 70B Instruct",
    "Trinity Mini",
];

export function getAnalysisSystemPrompt(language: string) {
    return TandSAnalyzer;
}


/**
 * Robust AI Service using OpenRouter with Model Fallback.
 */
export async function askAI(message: string, contextCode?: string, systemPromptOverride?: string, onStatus?: (status: string) => void): Promise<string> {
    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    const userPrompt = contextCode ? `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${message}` : message;

    // --- 1. Use OpenRouter Swarm ---
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("MISSING_API_KEY: Please set OPENROUTER_API_KEY");
    }

    let lastErrorMessage = "All models returned empty response";
    onStatus?.("Engaging neural nodes (OpenRouter Swarm)...");

    for (const model of lmodels) {
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
export async function* streamAI(input: string | { role: string, content: string }[], contextCode?: string, systemPromptOverride?: string): AsyncGenerator<string, void, unknown> {
    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;

    // Normalize input to history array and last user message
    let messages: { role: string, content: string }[] = [];
    let lastUserMessage = "";

    if (typeof input === 'string') {
        messages = [{ role: 'user', content: input }];
        lastUserMessage = input;
    } else {
        messages = input;
        const last = messages[messages.length - 1];
        if (last && last.role === 'user') lastUserMessage = last.content;
    }

    // Enhance the LAST user message with code context if provided
    // We only attach context to the latest prompt to save tokens and avoid confusion
    if (contextCode) {
        messages = messages.map((m, i) => {
            if (i === messages.length - 1 && m.role === 'user') {
                return { ...m, content: `Code Context:\n\`\`\`\n${contextCode}\n\`\`\`\n\nTask: ${m.content}` };
            }
            return m;
        });
        // Update lastUserMessage for string-based prompts
        lastUserMessage = messages[messages.length - 1].content;
    }

    // --- 1. Use OpenRouter Swarm ---
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("MISSING_API_KEY: Please set OPENROUTER_API_KEY");
    }

    let lastErrorMessage = "All models returned empty response";

    for (const model of lmodels) {
        try {
            console.log(`[AI Stream] 🤖 Attempting OpenRouter: ${model}...`);

            const completion = await openRouter.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...messages as any
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

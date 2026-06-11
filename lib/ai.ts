import OpenAI from 'openai';
import { TandSAnalyzer, CHAT_SYSTEM_PROMPT } from "./prompts";


// Initialize OpenRouter Client
const openRouter = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY || 'dummy_key',
    defaultHeaders: {
        "HTTP-Referer": "https://Tounge.app",
        "X-Title": "Tounge",
    }
});



const lmodels = [
    "groq/compound",
    "openai/gpt-oss-120b"
];

export function getAnalysisSystemPrompt(language: string) {
    return TandSAnalyzer;
}


function estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
}

function truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = Math.floor(maxTokens * 3.5);
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + "\n\n...[Code context truncated to fit token limits]...";
}

/**
 * Robust AI Service using OpenRouter with Model Fallback.
 */
export async function askAI(message: string, contextCode?: string, systemPromptOverride?: string, onStatus?: (status: string) => void): Promise<string> {

    const systemPrompt = systemPromptOverride || CHAT_SYSTEM_PROMPT;
    
    // Budgeting: Keep prompt well under Groq limit
    const MAX_TOTAL_TOKENS = 15000;
    const systemPromptTokens = estimateTokens(systemPrompt);
    const messageTokens = estimateTokens(message);
    const reservedTokens = systemPromptTokens + messageTokens + 500;
    const availableTokensForCode = Math.max(0, MAX_TOTAL_TOKENS - reservedTokens);

    let userPrompt = message;
    if (contextCode) {
        let processedCode = contextCode;
        if (estimateTokens(contextCode) > availableTokensForCode) {
            processedCode = truncateToTokens(contextCode, availableTokensForCode);
        }
        userPrompt = `Code Context:\n\`\`\`\n${processedCode}\n\`\`\`\n\nTask: ${message}`;
    }

    // --- 1. Use OpenRouter Swarm ---
    if (!process.env.AI_API_KEY) {
        throw new Error("MISSING_API_KEY: Please set API_KEY");
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
    let rawMessages: { role: string, content: string }[] = [];
    let lastUserMessage = "";

    if (typeof input === 'string') {
        rawMessages = [{ role: 'user', content: input }];
        lastUserMessage = input;
    } else {
        rawMessages = input;
        const last = rawMessages[rawMessages.length - 1];
        if (last && last.role === 'user') lastUserMessage = last.content;
    }

    // Budgeting: Keep request well under Groq limit
    const MAX_TOTAL_TOKENS = 15000;
    const systemPromptTokens = estimateTokens(systemPrompt);

    // Enhance and budget the latest user message
    let lastMsg = rawMessages[rawMessages.length - 1];
    let lastMsgContent = lastMsg ? lastMsg.content : "";

    if (contextCode && lastMsg && lastMsg.role === 'user') {
        const reservedTokens = systemPromptTokens + estimateTokens(lastUserMessage) + 500;
        const availableTokensForCode = Math.max(0, MAX_TOTAL_TOKENS - reservedTokens);
        
        let processedCode = contextCode;
        if (estimateTokens(contextCode) > availableTokensForCode) {
            processedCode = truncateToTokens(contextCode, availableTokensForCode);
        }
        lastMsgContent = `Code Context:\n\`\`\`\n${processedCode}\n\`\`\`\n\nTask: ${lastUserMessage}`;
    }

    // Build final messages list starting from the latest message and working backwards
    const finalMessages: { role: string, content: string }[] = [];
    if (lastMsg) {
        finalMessages.push({ role: lastMsg.role, content: lastMsgContent });
    }

    let tokensUsed = systemPromptTokens + estimateTokens(lastMsgContent);

    // Add previous history backwards while within budget
    for (let i = rawMessages.length - 2; i >= 0; i--) {
        const msg = rawMessages[i];
        const msgTokens = estimateTokens(msg.content);
        if (tokensUsed + msgTokens < MAX_TOTAL_TOKENS) {
            finalMessages.unshift(msg); // Prepend to keep chronological order
            tokensUsed += msgTokens;
        } else {
            console.log(`[AI Stream] Token limit reached. Dropping ${i + 1} older message(s) from history.`);
            break;
        }
    }

    // --- 1. Use OpenRouter Swarm ---
    if (!process.env.AI_API_KEY) {
        throw new Error("MISSING_API_KEY: Please set AI_API_KEY in your .env file");
    }

    let lastErrorMessage = "All models returned empty response";

    for (const model of lmodels) {
        try {
            console.log(`[AI Stream] 🤖 Attempting OpenRouter: ${model}...`);

            const completion = await openRouter.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...finalMessages as any
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

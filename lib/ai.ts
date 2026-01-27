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
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-flash-thinking-exp:free", // Added thinking model
    "meta-llama/llama-3-8b-instruct:free",       // Switched to 8b (more reliable than 70b)
    "mistralai/mistral-7b-instruct:free",        // Switched to 7b standard

];

export function getAnalysisSystemPrompt(language: string) {
    return `
    Example1:[{
  "language": "Python",
  "time": "O(n²)",
  "space": "O(1)",
  "explanation": "Nested loops checking every pair for two-sum target violates the optimal substructure property; misses hash map memoization opportunity.",
  "suggestions": [
    "Replace nested iteration with single-pass hash map storing (target - num) lookups, improving time to O(n) while maintaining O(n) space for the lookup table.",
    "If input is sorted, use two-pointer technique (left/right indices) to achieve O(n) time with O(1) space, avoiding hash map overhead."
  ]
}],
    Example2:[{
  "language": "Java",
  "time": "O(n log n)",
  "space": "O(n)",
  "explanation": "Brute-force interval comparison generates O(n²) overlaps; lacks sorting prerequisite that enables greedy linear merging.",
  "suggestions": [
    "Sort intervals by start time first, then single-pass merge with stack or in-place pointer, reducing time to O(n log n) dominated by sort, with O(n) output space.",
    "Consider interval tree or segment tree if queries are dynamic/many, trading O(n log n) construction for O(log n) per-query overlap detection."
  ]
}],
    Example3:[{
  "language": "C++",
  "time": "O(n log n)",
  "space": "O(n)",
  "explanation": "Full sort of array to find kth largest element is overkill; ignores quickselect or heap properties that exploit partial ordering.",
  "suggestions": [
    "Implement quickselect (Hoare's selection) for average O(n) time, O(1) space partitioning, avoiding the log n factor of full sorting.",
    "Maintain min-heap of size k while streaming elements: O(n log k) time, O(k) space—superior when k << n and dataset doesn't fit memory."
  ]
}],
    Example4:[{
  "language": "JavaScript",
  "time": "O(n²)",
  "space": "O(min(m, n))",
  "explanation": "Checking all substrings with nested loops and Set.reset() misses sliding window invariant that characters in window are unique.",
  "suggestions": [
    "Apply sliding window with two pointers and hash map storing last seen indices, shrinking window on duplicates for O(n) linear scan with O(min(m,n)) charset space.",
    "If alphabet is limited (ASCII), use fixed-size array[128] instead of hash map for O(1) access and better cache locality."
  ]
}],
    Example5:[{
  "language": "Go",
  "time": "O(n)",
  "space": "O(h)",
  "explanation": "Recursive DFS on unbalanced binary tree risks O(n) stack overflow; lacks Morris traversal or explicit stack iteration for O(1) space.",
  "suggestions": [
    "Convert to iterative inorder traversal using explicit stack slice to control memory, preventing goroutine stack growth and potential overflow on skewed trees.",
    "If tree is threaded modifiable, implement Morris Traversal for O(1) space O(n) time by temporarily creating links to predecessors."
  ]
}],
    
  
    `;
}

const CHAT_SYSTEM_PROMPT = `You are Tounge Code Assistant. Provide concise, accurate responses with Markdown.`;

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
                model: "gemini-2.0-flash-exp",
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

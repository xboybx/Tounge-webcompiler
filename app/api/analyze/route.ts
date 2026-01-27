import { NextResponse } from 'next/server';
import { askAI, getAnalysisSystemPrompt } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { code, language } = await req.json();
        console.log(`[Analyze API] 🚀 Request received for ${language}. Code length: ${code?.length}`);

        if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                time: "Key Missing",
                space: "-",
                explanation: "Please add your GEMINI_API_KEY or OPENROUTER_API_KEY to use AI Analysis.",
                suggestions: ["Configuration Required"]
            });
        }

        const systemPrompt = getAnalysisSystemPrompt(language);
        const userMessage = "Analyze Time and Space complexity. Return strict JSON.";

        console.log("[Analyze API] ⏳ Sending prompt to AI...");

        try {
            const textResponse = await askAI(userMessage, code, systemPrompt);
            console.log(`[Analyze API] 📩 Raw Response (First 100 chars): ${textResponse.substring(0, 100)}...`);

            // Sanitize Code Fences
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : textResponse;

            const result = JSON.parse(jsonStr);
            console.log("[Analyze API] ✅ JSON Parsed Successfully");
            return NextResponse.json(result);

        } catch (aiError: unknown) {
            // This now catches the actual API error message (e.g., "429 Rate limit exceeded")
            const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
            console.error(`[Analyze API] ❌ AI Error: ${errorMessage}`);
            return NextResponse.json({
                time: "AI Unavailable",
                space: "AI Unavailable",
                explanation: `The AI service reported: ${errorMessage}`,
                suggestions: [
                    "Switch to 'Local' analyzer in the top right to save tokens.",
                    "Wait a few minutes and try again when the free quota resets."
                ]
            });
        }

    } catch (error: unknown) {
        console.error("[Analyze API] 🔥 Fatal Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

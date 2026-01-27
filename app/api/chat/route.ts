import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { message, contextCode } = await req.json();

        // 1. Check for API Keys
        if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
            let reply = "⚠️ **Offline Mode**: Please set `GEMINI_API_KEY` or `OPENROUTER_API_KEY` in your `.env` file to use the AI Assistant.";

            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('dijkstra')) reply = "**Dijkstra Analysis (Offline)**: O((V+E) log V) Time, O(V+E) Space.";
            else if (lowerMsg.includes('complexity')) reply = "I can analyze complexity! Connect my brain (API Keys) to see me work.";

            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json({ reply });
        }

        // 2. Call AI Service
        const reply = await askAI(message, contextCode);
        return NextResponse.json({ reply });

    } catch (error: unknown) {
        console.error("Chat Route Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Connect Error";
        return NextResponse.json({
            reply: `🤖 **System Alert**: ${errorMessage}`
        });
    }
}

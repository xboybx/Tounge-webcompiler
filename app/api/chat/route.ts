import { NextResponse } from 'next/server';
import { streamAI } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { message, contextCode } = await req.json();

        // Use a ReadableStream for the response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // 1. Check for API Keys
                    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
                        let reply = "⚠️ **Offline Mode**: Please set `GEMINI_API_KEY` or `OPENROUTER_API_KEY` in your `.env` file to use the AI Assistant.";

                        const lowerMsg = message.toLowerCase();
                        if (lowerMsg.includes('dijkstra')) reply = "**Dijkstra Analysis (Offline)**: O((V+E) log V) Time, O(V+E) Space.";
                        else if (lowerMsg.includes('complexity')) reply = "I can analyze complexity! Connect my brain (API Keys) to see me work.";

                        // Simulate a small delay for "thinking"
                        await new Promise(resolve => setTimeout(resolve, 500));

                        controller.enqueue(new TextEncoder().encode(reply));
                        controller.close();
                        return;
                    }

                    // 2. Call Streamed AI Service
                    const generator = streamAI(message, contextCode);

                    for await (const chunk of generator) {
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }

                    controller.close();
                } catch (error: unknown) {
                    console.error("Chat Stream Error:", error);
                    const errorMessage = error instanceof Error ? error.message : "Connect Error";
                    controller.enqueue(new TextEncoder().encode(`\n\n🤖 **System Alert**: ${errorMessage}`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error: unknown) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            reply: `🤖 **System Alert**: Route Error`
        }, { status: 500 });
    }
}

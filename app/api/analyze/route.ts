import { NextResponse } from 'next/server';
import { askAI, getAnalysisSystemPrompt } from '@/lib/ai';

export async function POST(req: Request) {
    const encoder = new TextEncoder();

    // specific headers for SSE
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    };

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
        try {
            const { code, language } = await req.json();

            // Helper to send data
            const sendEvent = async (data: Record<string, unknown>) => {
                await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
                await sendEvent({
                    result: {
                        time: "Key Missing",
                        space: "-",
                        explanation: "Please add your GEMINI_API_KEY or OPENROUTER_API_KEY to use AI Analysis.",
                        suggestions: ["Configuration Required"]
                    }
                });
                await writer.close();
                return;
            }

            const systemPrompt = getAnalysisSystemPrompt(language);
            const userMessage = "Analyze Time and Space complexity. Return strict JSON.";

            try {
                // Pass status callback to stream updates
                const textResponse = await askAI(userMessage, code, systemPrompt, async (status) => {
                    await sendEvent({ status });
                });

                // Sanitize and Parse Result
                const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : textResponse;
                const result = JSON.parse(jsonStr);

                await sendEvent({ result });

            } catch (aiError: unknown) {
                const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
                await sendEvent({
                    result: {
                        time: "AI Unavailable",
                        space: "-",
                        explanation: `The AI service reported: ${errorMessage}`,
                        suggestions: ["Try switching to the Local Analyzer or wait for free quota reset."]
                    }
                });
            }

        } catch (error) {
            console.error("Stream Error:", error);
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "Internal Server Error" })}\n\n`));
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, { headers });
}

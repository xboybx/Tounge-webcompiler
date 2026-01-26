import { NextRequest, NextResponse } from 'next/server';
import { analyzeComplexity } from '@/lib/analyzer';

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    javascript: { language: 'javascript', version: '18.15.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    cpp: { language: 'cpp', version: '10.2.0' },
    go: { language: 'go', version: '1.16.2' },
    rust: { language: 'rust', version: '1.68.2' },
    csharp: { language: 'csharp', version: '6.12.0' },
    php: { language: 'php', version: '8.2.3' },
};

export async function POST(request: NextRequest) {
    try {
        const { code, language } = await request.json();

        if (!code || !language) {
            return NextResponse.json(
                { success: false, error: 'Code and language are required' },
                { status: 400 }
            );
        }

        const pistonConfig = LANGUAGE_MAP[language];
        if (!pistonConfig) {
            return NextResponse.json(
                { success: false, error: `Language ${language} is not supported for execution` },
                { status: 400 }
            );
        }

        const complexity = analyzeComplexity(code, language);
        const startTime = Date.now();

        const response = await fetch(PISTON_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: pistonConfig.language,
                version: pistonConfig.version,
                files: [{ content: code }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Execution engine returned ${response.status}`);
        }

        const result = await response.json();
        const executionTime = Date.now() - startTime;

        // Piston returns separate stdout and stderr in the run object
        const output = result.run.stdout;
        const error = result.run.stderr;

        return NextResponse.json({
            success: true,
            output: output || (error ? null : 'No output'),
            error: error || null,
            executionTime,
            language,
            metadata: {
                complexity
            }
        });

    } catch (error: any) {
        console.error('Execution error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'System failed to execute code' },
            { status: 500 }
        );
    }
}

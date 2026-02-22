import { NextRequest, NextResponse } from 'next/server';
import { analyzeComplexity } from '@/lib/analyzer';

// ============================================================
// WANDBOX API (Active - Free, No API key required)
// Docs: https://wandbox.org/
// API:  POST https://wandbox.org/api/compile.json
// ============================================================
const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// Wandbox compiler names (verified from https://wandbox.org/api/list.json)
const WANDBOX_LANGUAGE_MAP: Record<string, { compiler: string; filename: string }> = {
    javascript: { compiler: 'nodejs-20.17.0', filename: 'prog.js' },
    typescript: { compiler: 'typescript-5.6.2', filename: 'prog.ts' },
    python: { compiler: 'cpython-3.12.7', filename: 'prog.py' },
    java: { compiler: 'openjdk-jdk-22+36', filename: 'prog.java' },
    cpp: { compiler: 'gcc-13.2.0', filename: 'prog.cc' },
    go: { compiler: 'go-1.23.2', filename: 'prog.go' },
    rust: { compiler: 'rust-1.82.0', filename: 'prog.rs' },
    csharp: { compiler: 'dotnetcore-8.0.402', filename: 'prog.cs' },
    php: { compiler: 'php-8.3.12', filename: 'prog.php' },
};

// ============================================================
// PISTON API (Commented out - Now requires whitelist approval)
// As of 2/15/2026, public access is restricted.
// To re-enable: contact EngineerMan on Discord, get a token,
// add PISTON_API_KEY to .env, and uncomment the block below.
// ============================================================
//
// const PISTON_API = 'https://emkc.org/api/v2/piston/execute';
//
// const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
//     javascript: { language: 'javascript', version: '18.15.0' },
//     typescript: { language: 'typescript', version: '5.0.3'   },
//     python:     { language: 'python',     version: '3.10.0'  },
//     java:       { language: 'java',        version: '15.0.2' },
//     cpp:        { language: 'cpp',         version: '10.2.0' },
//     go:         { language: 'go',          version: '1.16.2' },
//     rust:       { language: 'rust',        version: '1.68.2' },
//     csharp:     { language: 'csharp',      version: '6.12.0' },
//     php:        { language: 'php',         version: '8.2.3'  },
// };
//
// async function executeWithPiston(code: string, language: string) {
//     const pistonConfig = PISTON_LANGUAGE_MAP[language];
//     const headers: HeadersInit = { 'Content-Type': 'application/json' };
//     if (process.env.PISTON_API_KEY) {
//         headers['Authorization'] = `Bearer ${process.env.PISTON_API_KEY}`;
//     }
//     const response = await fetch(PISTON_API, {
//         method: 'POST',
//         headers,
//         body: JSON.stringify({
//             language: pistonConfig.language,
//             version:  pistonConfig.version,
//             files:    [{ content: code }],
//         }),
//     });
//     if (!response.ok) throw new Error(`Piston returned ${response.status}`);
//     const result = await response.json();
//     return { output: result.run.stdout, error: result.run.stderr };
// }

export async function POST(request: NextRequest) {
    try {
        const { code, language } = await request.json();

        if (!code || !language) {
            return NextResponse.json(
                { success: false, error: 'Code and language are required' },
                { status: 400 }
            );
        }

        const wandboxConfig = WANDBOX_LANGUAGE_MAP[language];
        if (!wandboxConfig) {
            return NextResponse.json(
                { success: false, error: `Language ${language} is not supported for execution` },
                { status: 400 }
            );
        }

        const complexity = analyzeComplexity(code, language);
        const startTime = Date.now();

        // Execute with Wandbox
        const response = await fetch(WANDBOX_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                compiler: wandboxConfig.compiler,
                code,
                filename: wandboxConfig.filename,
                'save': false,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Wandbox API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
            });
            throw new Error(`Execution engine returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const executionTime = Date.now() - startTime;

        // Wandbox returns: program_output, compiler_error, program_error
        const output = result.program_output || '';
        const compilerError = result.compiler_error || '';
        const programError = result.program_error || '';
        const error = compilerError || programError || null;

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

    } catch (error: unknown) {
        console.error('Execution error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'System failed to execute code' },
            { status: 500 }
        );
    }
}

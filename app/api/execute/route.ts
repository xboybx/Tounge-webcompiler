import { NextRequest, NextResponse } from 'next/server';
import { analyzeComplexity } from '@/lib/analyzer';

// --- TYPES ---
interface ExecutionResult {
    output: string | null;
    error?: string | null;
    memory?: string | number | null;
    cpuTime?: string | number | null;
    provider: string;
}

// --- CONFIGURATION ---
const JDOODLE_URL = 'https://api.jdoodle.com/v1/execute';
const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// Optimized JDoodle Map for 2026
const JDOODLE_MAP: Record<string, { lang: string; ver: string }> = {
    javascript: { lang: 'nodejs', ver: '5' },
    typescript: { lang: 'typescript', ver: '0' },
    python: { lang: 'python3', ver: '4' },
    java: { lang: 'java', ver: '4' },
    cpp: { lang: 'cpp17', ver: '1' },
    go: { lang: 'go', ver: '4' },
    rust: { lang: 'rust', ver: '4' },
    csharp: { lang: 'csharp', ver: '4' },
    php: { lang: 'php', ver: '4' },
};

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

// --- EXECUTION HELPERS ---

/**
 * Execute code using JDoodle API
 * Fallback to null if limit reached or credentials missing
 */
async function executeWithJDoodle(code: string, language: string): Promise<ExecutionResult | null> {
    const config = JDOODLE_MAP[language];
    if (!config || !process.env.JDOODLE_CLIENT_ID) return null;

    try {
        const response = await fetch(JDOODLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: process.env.JDOODLE_CLIENT_ID,
                clientSecret: process.env.JDOODLE_CLIENT_SECRET,
                script: code,
                language: config.lang,
                versionIndex: config.ver,
            }),
        });

        if (!response.ok) {
            console.error(`[EXEC JDoodle Error] HTTP ${response.status} for ${language}`);
            return null;
        }

        const data = await response.json();

        // Handle specific JDoodle error codes
        if (data.statusCode === 401 || data.statusCode === 429) {
            console.warn(`[EXEC JDoodle] Status ${data.statusCode} (Auth/Limit) for ${language}`);
            return null;
        }

        return {
            output: data.output || '',
            error: null,
            memory: data.memory ?? 'N/A',
            cpuTime: data.cpuTime ?? 'N/A',
            provider: 'JDoodle'
        };
    } catch (e: any) {
        console.error(`[EXEC JDoodle Exception] ${e.message}`);
        return null;
    }
}

/**
 * Execute code using Wandbox API (Free and Reliable Fallback)
 */
async function executeWithWandbox(code: string, language: string): Promise<ExecutionResult | null> {
    const config = WANDBOX_LANGUAGE_MAP[language];
    if (!config) return null;

    try {
        const response = await fetch(WANDBOX_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                compiler: config.compiler,
                code: code,
                save: false,
            }),
        });

        if (!response.ok) {
            console.error(`[EXEC Wandbox] Failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Wandbox returns output in program_output/program_error
        const output = data.program_output || '';
        const error = data.program_error || data.compiler_error || '';

        return {
            output: output || (error ? null : 'No output'),
            error: error || null,
            memory: 'N/A',
            cpuTime: 'N/A',
            provider: 'Wandbox'
        };
    } catch (e: any) {
        console.error(`[EXEC Wandbox Exception] ${e.message}`);
        return null;
    }
}

// --- MAIN ROUTE ---

export async function POST(request: NextRequest) {
    try {
        const { code, language } = await request.json();

        // Detailed check if environment variables are LOADED in production
        if (process.env.NODE_ENV === 'production' && !process.env.JDOODLE_CLIENT_ID) {
            console.warn(`[EXEC] Warning: JDOODLE_CLIENT_ID NOT detected in production environment.`);
        }

        const complexity = analyzeComplexity(code, language);
        const startTime = Date.now();

        let result: ExecutionResult | null = null;

        // Step 1: Try JDoodle (Full Stats)
        result = await executeWithJDoodle(code, language);


        // Step 2: Fallback to Wandbox (Reliable Free Engine)
        if (!result) {
            console.log(`[EXEC] JDoodle unavailable. Falling back to Wandbox for ${language}...`);
            result = await executeWithWandbox(code, language);
        }

        const executionTime = Date.now() - startTime;

        if (!result) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All execution engines failed. Please verify your Environment Variables and API limits.',
                    details: 'Wandbox (Free Fallback) also failed. This might be a network issue.'
                },
                { status: 503 } // Service Unavailable
            );
        }

        return NextResponse.json({
            success: true,
            output: result.output,
            error: result.error || null,
            executionTime,
            language,
            metadata: {
                complexity,
                provider: result.provider,
                memory: result.memory,
                cpuTime: result.cpuTime
            }
        });

    } catch (error: any) {
        console.error(`[EXEC Global Catch] ${error.message}`);
        return NextResponse.json(
            { success: false, error: error.message || 'System error during execution' },
            { status: 500 }
        );
    }
}

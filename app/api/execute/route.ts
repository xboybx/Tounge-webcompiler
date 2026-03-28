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
const PAIZA_CREATE_URL = 'https://api.paiza.io/v1/runners/create';
const PAIZA_STATUS_URL = 'https://api.paiza.io/v1/runners/get_details';

// Optimized JDoodle Map for 2026
const JDOODLE_MAP: Record<string, { lang: string; ver: string }> = {
    javascript: { lang: 'nodejs', ver: '5' },
    typescript: { lang: 'typescript', ver: '3' },
    python: { lang: 'python3', ver: '4' },
    java: { lang: 'java', ver: '4' },
    cpp: { lang: 'cpp17', ver: '1' }, 
    go: { lang: 'go', ver: '4' },
    rust: { lang: 'rust', ver: '4' },
    csharp: { lang: 'csharp', ver: '4' },
    php: { lang: 'php', ver: '4' },
};

const PAIZA_MAP: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python3',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
    rust: 'rust',
    csharp: 'csharp',
    php: 'php',
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

        const data = await response.json();

        // Handle error codes (401/429/etc)
        if (data.statusCode === 401 || data.statusCode === 429 || !response.ok) {
            return null;
        }

        return {
            output: data.output || '',
            error: null,
            memory: data.memory ?? 'N/A',
            cpuTime: data.cpuTime ?? 'N/A',
            provider: 'JDoodle'
        };
    } catch (e) {
        return null;
    }
}

/**
 * Execute code using Paiza.io API (Guest Mode)
 */
async function executeWithPaiza(code: string, language: string): Promise<ExecutionResult | null> {
    const lang = PAIZA_MAP[language];
    if (!lang) return null;

    try {
        // 1. Create runner
        const createRes = await fetch(`${PAIZA_CREATE_URL}?source_code=${encodeURIComponent(code)}&language=${lang}&api_key=guest`, {
            method: 'POST'
        });
        const createData = await createRes.json();
        
        if (!createData.id) return null;

        // 2. Intelligent Polling (Wait for job completion)
        let statusData: any;
        let attempts = 0;
        const maxAttempts = 5;

        do {
            // Wait slightly longer each time
            await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 1000 : 1500));
            
            const statusRes = await fetch(`${PAIZA_STATUS_URL}?id=${createData.id}&api_key=guest`);
            statusData = await statusRes.json();
            
            attempts++;
        } while (statusData.status !== 'completed' && attempts < maxAttempts);

        if (statusData.status !== 'completed') return null;

        const output = statusData.stdout || '';
        const error = statusData.stderr || statusData.build_stderr || '';

        return {
            output: output || (error ? null : 'No output'),
            error: error || null,
            memory: 'N/A',
            cpuTime: 'N/A',
            provider: 'Paiza.io'
        };
    } catch (e) {
        return null;
    }
}

// --- MAIN ROUTE ---

export async function POST(request: NextRequest) {
    try {
        const { code, language } = await request.json();
        const complexity = analyzeComplexity(code, language);
        const startTime = Date.now();

        let result: ExecutionResult | null = null;

        // Step 1: Try JDoodle (Fast)
        result = await executeWithJDoodle(code, language);

        // Step 2: Fallback to Paiza if JDoodle fails or limit hit
        if (!result) {
            console.log(`[EXEC] Switching to Paiza for ${language} execution`);
            result = await executeWithPaiza(code, language);
        }

        const executionTime = Date.now() - startTime;

        if (!result) {
            return NextResponse.json(
                { success: false, error: 'All execution engines failed. Please try again later.' },
                { status: 500 }
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
        return NextResponse.json(
            { success: false, error: error.message || 'System error during execution' },
            { status: 500 }
        );
    }
}

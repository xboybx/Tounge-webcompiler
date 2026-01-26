import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure temp directory exists
async function ensureTempDir() {
    try {
        await mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureTempDir();

        const { code, language, runtime } = await request.json();

        if (!code || !language) {
            return NextResponse.json(
                { success: false, error: 'Code and language are required' },
                { status: 400 }
            );
        }

        const fileId = uuidv4();
        let output = '';
        let error = '';
        let executionTime = 0;

        const startTime = Date.now();

        try {
            switch (language) {
                case 'javascript':
                case 'typescript':
                    output = await executeJavaScript(code, language, fileId);
                    break;
                case 'python':
                    output = await executePython(code, fileId);
                    break;
                case 'java':
                    output = await executeJava(code, fileId);
                    break;
                case 'cpp':
                    output = await executeCpp(code, fileId);
                    break;
                case 'go':
                    output = await executeGo(code, fileId);
                    break;
                case 'rust':
                    output = await executeRust(code, fileId);
                    break;
                case 'csharp':
                    output = await executeCSharp(code, fileId);
                    break;
                case 'php':
                    output = await executePhp(code, fileId);
                    break;
                default:
                    return NextResponse.json(
                        { success: false, error: `Language ${language} is not supported for execution` },
                        { status: 400 }
                    );
            }
        } catch (err: any) {
            error = err.message || err.toString();
        }

        executionTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            output: output || 'No output',
            error: error || null,
            executionTime,
            language,
        });
    } catch (error: any) {
        console.error('Execution error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

async function executeJavaScript(code: string, language: string, fileId: string): Promise<string> {
    const isTS = language === 'typescript';
    const fileName = path.join(TEMP_DIR, `${fileId}.${isTS ? 'ts' : 'js'}`);

    // Create a rich environment that supports both Node and Browser-like objects
    const wrappedCode = `
// Basic Browser Object Simulation (Optional / Helper)
if (typeof global !== 'undefined' && !global.window) {
    global.window = global;
    global.document = {
        getElementById: () => null,
        querySelector: () => null,
        createElement: () => ({ style: {}, appendChild: () => {} }),
        addEventListener: () => {},
    };
    global.navigator = { userAgent: 'Node.js' };
    global.localStorage = { getItem: () => null, setItem: () => {} };
}

// User Code
${code}
`;

    await writeFile(fileName, wrappedCode);

    try {
        const cmd = isTS ? `npx tsx ${fileName}` : `node ${fileName}`;
        const { stdout, stderr } = await execAsync(cmd, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });
        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
    }
}

async function executePython(code: string, fileId: string): Promise<string> {
    const fileName = path.join(TEMP_DIR, `${fileId}.py`);
    await writeFile(fileName, code);

    try {
        const { stdout, stderr } = await execAsync(`python ${fileName}`, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });
        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
    }
}

async function executeJava(code: string, fileId: string): Promise<string> {
    // Extract class name from code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : 'Main';

    const fileName = path.join(TEMP_DIR, `${className}.java`);
    await writeFile(fileName, code);

    try {
        // Compile
        await execAsync(`javac ${fileName}`, {
            timeout: 10000,
            cwd: TEMP_DIR,
        });

        // Run
        const { stdout, stderr } = await execAsync(`java -cp ${TEMP_DIR} ${className}`, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });

        // Clean up class file
        await unlink(path.join(TEMP_DIR, `${className}.class`)).catch(() => { });

        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
    }
}

async function executeCpp(code: string, fileId: string): Promise<string> {
    const sourceFile = path.join(TEMP_DIR, `${fileId}.cpp`);
    const outputFile = path.join(TEMP_DIR, `${fileId}.exe`);
    await writeFile(sourceFile, code);

    try {
        // Compile
        await execAsync(`g++ ${sourceFile} -o ${outputFile}`, {
            timeout: 10000,
        });

        // Run
        const { stdout, stderr } = await execAsync(outputFile, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });

        return stdout + (stderr || '');
    } finally {
        await unlink(sourceFile).catch(() => { });
        await unlink(outputFile).catch(() => { });
    }
}

async function executeGo(code: string, fileId: string): Promise<string> {
    const fileName = path.join(TEMP_DIR, `${fileId}.go`);
    await writeFile(fileName, code);

    try {
        const { stdout, stderr } = await execAsync(`go run ${fileName}`, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });
        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
    }
}

async function executeRust(code: string, fileId: string): Promise<string> {
    const fileName = path.join(TEMP_DIR, `${fileId}.rs`);
    const outputFile = path.join(TEMP_DIR, `${fileId}`);
    await writeFile(fileName, code);

    try {
        // Compile
        await execAsync(`rustc ${fileName} -o ${outputFile}`, {
            timeout: 10000,
        });

        // Run
        const { stdout, stderr } = await execAsync(outputFile, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });

        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
        await unlink(outputFile).catch(() => { });
    }
}

async function executeCSharp(code: string, fileId: string): Promise<string> {
    const fileName = path.join(TEMP_DIR, `${fileId}.cs`);
    const outputFile = path.join(TEMP_DIR, `${fileId}.exe`);
    await writeFile(fileName, code);

    try {
        // Compile
        await execAsync(`csc ${fileName} /out:${outputFile}`, {
            timeout: 10000,
        });

        // Run
        const { stdout, stderr } = await execAsync(outputFile, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });

        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
        await unlink(outputFile).catch(() => { });
    }
}

async function executePhp(code: string, fileId: string): Promise<string> {
    const fileName = path.join(TEMP_DIR, `${fileId}.php`);
    await writeFile(fileName, code);

    try {
        const { stdout, stderr } = await execAsync(`php ${fileName}`, {
            timeout: 10000,
            maxBuffer: 1024 * 1024,
        });
        return stdout + (stderr || '');
    } finally {
        await unlink(fileName).catch(() => { });
    }
}

/**
 * LogicCraft High-Caliber Local Analyzer
 * Supports: JavaScript, TypeScript, Python
 * Generic pattern-based analysis (not hardcoded to specific problems)
 */

interface ComplexityResult {
    time: string;
    space: string;
    maintainability: number;
    cyclomatic: number;
}

export function analyzeComplexity(code: string, language: string): ComplexityResult {
    const lang = language.toLowerCase();
    const cleanCode = removeComments(code, lang);

    if (lang === 'python') {
        return analyzePython(cleanCode);
    } else {
        return analyzeJsTs(cleanCode);
    }
}

// --------------------------------------------------------------------------
// SHARED UTILS
// --------------------------------------------------------------------------

function removeComments(code: string, language: string): string {
    if (language === 'python') {
        return code.replace(/#.*$/gm, '');
    } else {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
    }
}

// --------------------------------------------------------------------------
// JS / TS ANALYZER - Generic Pattern Detection
// --------------------------------------------------------------------------

function analyzeJsTs(code: string): ComplexityResult {
    const lines = code.split('\n');
    const safeCode = code.replace(/["'`].*?["'`]/g, '');

    // === RECURSION DETECTION ===
    let isRecursive = false;
    const funcMatches = safeCode.match(/function\s+(\w+)/g);

    if (funcMatches) {
        for (const match of funcMatches) {
            const funcName = match.replace('function ', '');
            const funcCallRegex = new RegExp(`\\b${funcName}\\s*\\(`);
            const occurrences = (safeCode.match(funcCallRegex) || []).length;
            if (occurrences > 1) {
                isRecursive = true;
                break;
            }
        }
    }

    // === LOOP NEST DEPTH ANALYSIS ===
    let maxLoopNesting = 0;
    let currentNesting = 0;
    const codeLines = safeCode.split('\n');

    for (const line of codeLines) {
        if (/\b(for|while)\b/.test(line) && /{/.test(line)) {
            currentNesting++;
            if (currentNesting > maxLoopNesting) {
                maxLoopNesting = currentNesting;
            }
        }

        const closingBraces = (line.match(/}/g) || []).length;
        if (closingBraces > 0 && currentNesting > 0) {
            currentNesting = Math.max(0, currentNesting - closingBraces);
        }
    }

    // === DIVIDE AND CONQUER DETECTION ===
    const hasMidpoint = /Math\.floor\(.*?\/\s*2\)|>>.*1|mid\s*=/.test(safeCode);
    const hasSliceOrSubarray = /\.slice\(/.test(safeCode);
    const isDivideConquer = isRecursive && (hasMidpoint || hasSliceOrSubarray);

    // === BRANCHING FACTOR ===
    let recursiveBranching = 1;
    if (isRecursive) {
        // Count recursive calls - look for patterns like func(...) func(...)
        const lines = safeCode.split('\n');
        for (const line of lines) {
            const matches = line.match(/\w+\(/g);
            if (matches && matches.length >= 2) {
                recursiveBranching = Math.max(recursiveBranching, matches.length);
            }
        }
    }

    // === SPACE COMPLEXITY ANALYSIS ===
    const hasMapSet = /new Map\(|new Set\(/.test(safeCode);
    const hasArraySpread = /\[\.\.\./.test(safeCode);
    const hasSlice = /\.slice\(/.test(safeCode);
    const hasMapMethod = /\.map\(/.test(safeCode);
    const hasNewArray = /new Array\(/.test(safeCode);
    const hasArrayInit = /=\s*\[\s*\]/gm.test(safeCode);

    let space = "O(1)";

    if (hasMapSet || hasArraySpread || hasSlice || hasMapMethod || hasNewArray || hasArrayInit) {
        space = "O(N)";
    }

    if (isRecursive) {
        space = "O(N)";
    }

    // === TIME COMPLEXITY DETERMINATION ===
    let time = "O(1)";

    // Binary search: loop with halving
    if (!isRecursive && hasMidpoint && /while/.test(safeCode)) {
        time = "O(log N)";
        space = "O(1)";
    }
    // Divide & Conquer (MergeSort, QuickSort)
    else if (isDivideConquer && recursiveBranching >= 2) {
        time = "O(N log N)";
    }
    // Linear recursion (e.g., factorial)
    else if (isRecursive && recursiveBranching <= 2 && maxLoopNesting === 0) {
        time = "O(N)";
    }
    // Exponential recursion
    else if (isRecursive && recursiveBranching >= 3) {
        time = "O(2^N)";
    }
    // Nested loops
    else if (maxLoopNesting === 3) {
        time = "O(N³)";
    }
    else if (maxLoopNesting === 2) {
        time = "O(N²)";
    }
    else if (maxLoopNesting === 1) {
        time = "O(N)";
    }
    // Simple recursion fallback
    else if (isRecursive) {
        time = "O(N)";
    }

    const cyclomatic = (safeCode.match(/\b(if|while|for|case|\&\&|\|\|)\b/g) || []).length + 1;
    const maintainability = Math.max(0, 100 - (cyclomatic * 2) - (lines.length / 2));

    return {
        time: normalizeTime(time),
        space: normalizeSpace(space),
        maintainability: Math.round(maintainability),
        cyclomatic
    };
}

// --------------------------------------------------------------------------
// PYTHON ANALYZER - Generic Pattern Detection
// --------------------------------------------------------------------------

function analyzePython(code: string): ComplexityResult {
    const lines = code.split('\n');

    // === RECURSION DETECTION (only within function body) ===
    let isRecursive = false;
    const funcMatch = /def\s+(\w+)\s*\(/.exec(code);
    if (funcMatch) {
        const funcName = funcMatch[1];
        const funcDefIndex = funcMatch.index + funcMatch[0].length;

        let funcBody = '';
        const codeLines = code.slice(funcDefIndex).split('\n');
        for (let i = 1; i < codeLines.length; i++) {
            const line = codeLines[i];
            if (line.length > 0 && line[0] !== ' ' && line[0] !== '\t') {
                break;
            }
            funcBody += line + '\n';
        }

        const regex = new RegExp(`\\b${funcName}\\s*\\(`);
        isRecursive = regex.test(funcBody);
    }

    // === LOOP NESTING DEPTH ===
    let loopNesting = 0;
    let maxLoopNesting = 0;
    const pythonLines = code.split('\n');

    for (const line of pythonLines) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('#') || trimmed.length === 0) continue;

        const indent = line.length - trimmed.length;

        // Detect loop start
        if (/^(for|while)\s/.test(trimmed)) {
            loopNesting++;
            if (loopNesting > maxLoopNesting) {
                maxLoopNesting = loopNesting;
            }
        }

        // Dedent closes blocks
        if (indent === 0 && !trimmed.startsWith('def')) {
            loopNesting = 0;
        }
    }

    // === BINARY SEARCH PATTERN ===
    const hasMidpoint = /(\/\/|>>|divmod).*2/.test(code);
    const isBinarySearch = hasMidpoint && /while/.test(code);

    // === TIME COMPLEXITY ===
    let time = "O(1)";

    if (isBinarySearch) {
        time = "O(log N)";
    }
    else if (maxLoopNesting === 3) {
        time = "O(N³)";
    }
    else if (maxLoopNesting === 2) {
        time = "O(N²)";
    }
    else if (maxLoopNesting === 1) {
        time = "O(N)";
    }
    else if (isRecursive) {
        time = "O(N)";
    }

    // === SPACE COMPLEXITY ===
    let space = "O(1)";

    if (isRecursive) {
        space = "O(N)";
    }

    if (code.includes('list(') || /=\s*\[/.test(code) || /\[.*for.*in.*\]/.test(code)) {
        space = "O(N)";
    }

    const cyclomatic = (code.match(/\b(if|elif|for|while|except|with|and|or)\b/g) || []).length + 1;
    const maintainability = Math.max(0, 100 - (cyclomatic * 3) - (lines.length / 2));

    return {
        time: normalizeTime(time),
        space: normalizeSpace(space),
        maintainability: Math.round(maintainability),
        cyclomatic
    };
}

// --------------------------------------------------------------------------
// NORMALIZATION
// --------------------------------------------------------------------------

function normalizeTime(t: string): string {
    const norm = t.replace(/n/g, 'N').replace('logN', 'log N');
    if (norm === "O(N^2)") return "O(N²)";
    if (norm === "O(N logN)") return "O(N log N)";
    return norm;
}

function normalizeSpace(s: string): string {
    return s.replace(/n/g, 'N');
}

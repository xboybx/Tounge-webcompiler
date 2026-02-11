import { Terminal, AlertCircle, Sparkles, Columns, Rows, ClockCheck, CheckCircle2, Timer, Lightbulb, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import Tooltip from '@/components/ui/Tooltip';

interface OutputPanelProps {
    output: string;
    error: string | null;
    isRunning: boolean;
    executionTime: number | null;
    complexity: {
        time: string;
        space: string;
        maintainability?: number;
        cyclomatic?: number;
    } | null;
    terminalPosition: 'right' | 'bottom';
    onTogglePosition: () => void;
    onClear?: () => void;
    codeContext?: string;
    language?: string;
}



export default function OutputPanel({
    output,
    error,
    isRunning,
    executionTime,
    complexity,
    terminalPosition,
    onTogglePosition,
    onClear,
    codeContext = "",
    language = "javascript"
}: OutputPanelProps) {
    const [aiComplexity, setAiComplexity] = useState<{ time: string, space: string, explanation?: string, suggestions?: string | string[] } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiMode, setAiMode] = useState(false); // Default OFF
    const [aiLog, setAiLog] = useState("");
    const [isAiExpanded, setIsAiExpanded] = useState(true);

    const activeStats = aiMode ? aiComplexity : complexity;

    const handleDeepAnalyze = useCallback(async () => {
        if (isAnalyzing || !codeContext) return;
        setIsAnalyzing(true);
        setAiLog("Initializing Tounge Secure Uplink...");

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeContext, language })
            });

            if (!res.body) throw new Error("No response stream");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Keep incomplete part

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.slice(6));

                            if (json.status) {
                                setAiLog(json.status);
                            }
                            if (json.result) {
                                setAiComplexity(json.result);
                            }
                        } catch (e) {
                            console.error("Stream Parse Error", e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setAiLog("Connection Failed.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing, codeContext, language]);

    useEffect(() => {
        // Reset state when a new run starts
        if (isRunning) {
            setAiComplexity(null);
        }

        // Auto-run AI analysis if not running, context exists, mode is ON, and no result yet
        if (!isRunning && codeContext && aiMode && !aiComplexity && output) {
            handleDeepAnalyze();
        }
    }, [isRunning, codeContext, aiMode, aiComplexity, output, handleDeepAnalyze]);



    const toggleAiMode = () => {
        setAiMode(!aiMode);
    };

    return (
        <div className="flex h-full flex-col bg-black border-l border-[#111]">
            {/* Header */}
            <div
                className="flex h-14 items-center justify-between border-b border-[#111] bg-[#050505] shrink-0"
                style={{ paddingLeft: '20px', paddingRight: '20px' }}
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} strokeWidth={3} className="text-white/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Execution Output</span>
                    </div>

                    <div className="w-px h-4 bg-[#1a1a1a]" />

                    <Tooltip content={terminalPosition === 'right' ? "Move to Bottom" : "Move to Side"} position="bottom">
                        <button
                            onClick={onTogglePosition}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all group active:scale-95"
                        >
                            {terminalPosition === 'right' ? (
                                <Rows size={14} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                            ) : (
                                <Columns size={14} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                            )}
                        </button>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-4">
                    {/* AI Trigger Button */}
                    <Tooltip content={aiMode ? "Space Complexity" : "Time Complexity"} position="bottom">
                        <button
                            onClick={toggleAiMode}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${aiMode
                                ? (isAnalyzing ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20')
                                : 'text-white/20 hover:text-white border border-transparent'
                                }`}
                        >
                            {aiMode ? (
                                <ClockCheck size={18} strokeWidth={3} />
                            ) : (
                                <Timer size={18} strokeWidth={3} />
                            )}
                        </button>
                    </Tooltip>

                    {/* Clear Button */}
                    {onClear && (
                        <Tooltip content="Clear Output" position="bottom">
                            <button
                                onClick={onClear}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-white/30 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 active:scale-95"
                            >
                                <Trash size={18} strokeWidth={3} />
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div
                className="flex-1 overflow-auto py-14 font-mono scrollbar-hide selection:bg-white/20"

            >
                <div>
                    {/* AI Explanation Injection */}
                    {aiMode && aiComplexity?.explanation && !error && output && (
                        <div className="mb-8 border border-white/10 rounded-xl bg-white/5 overflow-hidden "
                            style={{ marginLeft: '9px', marginTop: '0px' }}>
                            {/* Collapsible Header */}
                            <button
                                onClick={() => setIsAiExpanded(!isAiExpanded)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">AI Analysis Report</span>
                                </div>
                                {isAiExpanded ? (
                                    <ChevronUp size={16} className="text-white/50" />
                                ) : (
                                    <ChevronDown size={16} className="text-white/50" />
                                )}
                            </button>

                            <AnimatePresence>
                                {isAiExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden "
                                    >
                                        <div className="p-4 space-y-4 border-t border-white/5">
                                            {/* Explanation Block */}
                                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-purple-400/70 uppercase tracking-wider">Insight</span>
                                                </div>
                                                <p className="text-sm text-purple-200/80 leading-relaxed max-w-3xl">
                                                    {aiComplexity.explanation}
                                                </p>
                                            </div>

                                            {/* Suggestions Block */}
                                            {aiComplexity.suggestions && (
                                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Lightbulb size={14} className="text-amber-400/70" />
                                                        <span className="text-[10px] font-black text-amber-400/70 uppercase tracking-wider">Optimization</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {Array.isArray(aiComplexity.suggestions) ? (
                                                            aiComplexity.suggestions.map((s, idx) => (
                                                                <p key={idx} className="text-sm text-amber-200/80 leading-relaxed max-w-3xl">
                                                                    • {s}
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-amber-200/80 leading-relaxed max-w-3xl">
                                                                {aiComplexity.suggestions}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                </div>
                {/* Error State */}
                {error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col gap-6 p-8 rounded-[24px] bg-[#ff0000]/5 border border-[#ff0000]/10 shadow-[0_24px_64px_rgba(255,0,0,0.05)]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0000]/10 border border-[#ff0000]/20">
                                    <AlertCircle size={20} strokeWidth={3} className="text-[#ff0000]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ff0000]/40 leading-none mb-1.5">Runtime Fault</span>
                                    <span className="text-lg font-black text-white uppercase tracking-tight">Standard Error</span>
                                </div>
                            </div>

                            <pre className="text-sm leading-relaxed whitespace-pre-wrap text-[#ff4d4d] pl-4 font-mono border-l-2 border-[#ff0000]/20">{error}</pre>
                        </div>
                    </motion.div>
                ) : output ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                        style={{ marginLeft: '9px', marginTop: '20px' }}
                    >
                        <div className="flex items-center gap-3 mb-4 opacity-30 ">
                            <CheckCircle2 size={14} strokeWidth={3} className="text-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Stream Output</span>
                        </div>
                        <div className="relative pl-6">
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
                            <pre className="text-[13px] leading-7 whitespace-pre-wrap text-white/90 font-mono">{`=> ${output}`}</pre>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex h-full items-center justify-center pb-20">
                        <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${isRunning ? 'opacity-80' : 'opacity-20'}`}>
                            {/* Tounge Image */}
                            <img
                                src="/tounge.png"
                                alt="Tounge State"
                                className={`w-32 h-32 object-contain transition-all duration-500 ${isRunning ? 'grayscale-0 scale-110 animate-pulse' : 'opacity-50 grayscale hover:grayscale-0'}`}
                            />
                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] mt-6 transition-all duration-500 ${isRunning
                                ? 'bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-[#333] via-white to-[#333]'
                                : 'text-white'
                                }`}>
                                {isRunning ? "Compiling..." : "Ready to Execute"}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Connection Logs - Visible only during analysis */}
            {isAnalyzing && (
                <div
                    className="flex items-center justify-center py-2 shrink-0 bg-[#050505] border-t border-[#111] border-b-0"
                    style={{ paddingLeft: '20px', paddingRight: '20px' }}
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-[#333] via-white to-[#333]">
                        {aiLog}
                    </span>
                </div>
            )}

            {/* Footer - Complexity Stats */}
            {
                (activeStats || isAnalyzing) && (
                    <div
                        className="flex items-center justify-between border-t border-[#111] bg-[#050505] py-3 shrink-0"
                        style={{ paddingLeft: '20px', paddingRight: '20px' }}
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Time</span>
                                {isAnalyzing ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/10 border-t-[#00a3ff] mt-0.5" />
                                ) : (
                                    <span className={`text-xs font-black uppercase tracking-widest ${aiMode && aiComplexity ? 'text-purple-400' : 'text-[#00a3ff]'}`}>
                                        {activeStats?.time || '-'}
                                    </span>
                                )}
                            </div>

                            <div className="w-px h-6 bg-[#1a1a1a]" />

                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Space</span>
                                {isAnalyzing ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/10 border-t-purple-400 mt-0.5" />
                                ) : (
                                    <span className={`text-xs font-black uppercase tracking-widest ${aiMode && aiComplexity ? 'text-purple-400' : 'text-purple-400'}`}>
                                        {activeStats?.space || '-'}
                                    </span>
                                )}
                            </div>

                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-[#1a1a1a]">
                            <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Time:</span>
                            <span className="text-xs font-black uppercase tracking-widest text-[#32a852]">
                                {executionTime ? `${executionTime}ms` : '-'}
                            </span>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

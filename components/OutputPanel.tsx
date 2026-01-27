import { Terminal, AlertCircle, Sparkles, Columns, Rows, CheckCircle2, ChartLine, Lightbulb, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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

    const activeStats = aiMode ? aiComplexity : complexity;

    const handleDeepAnalyze = useCallback(async () => {
        if (isAnalyzing || !codeContext) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeContext, language })
            });
            const data = await res.json();

            if (data.time) setAiComplexity(data);
        } catch {
            // Error handled by state reset or UI
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
            <div className="flex h-14 items-center justify-between border-b border-[#111] bg-[#050505] px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} strokeWidth={3} className="text-white/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Execution Output</span>
                    </div>

                    <div className="w-px h-4 bg-[#1a1a1a]" />

                    <button
                        onClick={onTogglePosition}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all group active:scale-95"
                        title={terminalPosition === 'right' ? "Move to Bottom" : "Move to Side"}
                    >
                        {terminalPosition === 'right' ? (
                            <Rows size={14} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                        ) : (
                            <Columns size={14} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    {/* AI Trigger Button - Always Visible */}
                    <button
                        onClick={toggleAiMode}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${aiMode
                            ? (isAnalyzing ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20')
                            : 'text-white/20 hover:text-white border border-transparent'
                            }`}
                        title={aiMode ? "AI Analysis Enabled" : "Enable AI Logic"}
                    >
                        {aiMode ? (
                            <ChartLine size={20} strokeWidth={3} />
                        ) : (
                            <ChartLine size={18} strokeWidth={3} />
                        )}
                    </button>

                    {/* Clear Button - Always Visible if onClear exists */}
                    {onClear && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all text-white/30 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 active:scale-95"
                            title="Clear Output"
                        >
                            <Trash size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-12 font-mono scrollbar-hide selection:bg-white/20">
                {/* AI Explanation Injection */}
                {aiMode && aiComplexity?.explanation && !error && output && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 space-y-4"
                    >
                        {/* Explanation Block */}
                        <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles size={16} className="text-purple-400" />
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Audit Report</span>
                            </div>
                            <p className="text-sm text-purple-200/80 leading-relaxed max-w-3xl">
                                {aiComplexity.explanation}
                            </p>
                        </div>

                        {/* Suggestions Block */}
                        {aiComplexity.suggestions && (
                            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <Lightbulb size={16} className="text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Optimization Tips</span>
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
                    </motion.div>
                )}

                {error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col gap-6 p-10 rounded-[32px] bg-[#ff0000]/2 border border-[#ff0000]/20 shadow-[0_24px_64px_rgba(255,0,0,0.05)]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff0000]/10 border border-[#ff0000]/20">
                                    <AlertCircle size={24} strokeWidth={3} className="text-[#ff0000]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ff0000]/40 leading-none mb-1.5">Runtime Fault</span>
                                    <span className="text-lg font-black text-white uppercase tracking-tight">Standard Error</span>
                                </div>
                            </div>

                            <pre className="text-sm leading-relaxed whitespace-pre-wrap text-[#ff4d4d] ml-8 pl-4 font-mono border-l-2 border-[#ff0000]/10">{error}</pre>
                        </div>
                    </motion.div>
                ) : output ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4 opacity-20">
                            <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Stream Recovered</span>
                        </div>
                        <div className="relative ml-8">
                            <pre className="text-base leading-relaxed whitespace-pre-wrap text-white font-mono">{output}</pre>
                            <div className="absolute -left-6 top-0 bottom-0 w-px bg-white/5" />
                        </div>

                        {/* Runtime Footer Removed */}
                    </motion.div>
                ) : !isRunning ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 opacity-20">
                            {/* Tounge Idle Image */}
                            <img
                                src="/tounge.png"
                                alt="Tounge Idle"
                                className="w-48 h-48 object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
                            />
                            <span className="text-xs font-black uppercase tracking-[0.6em] text-white">Tounge is Idle</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-8">
                            <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-black uppercase tracking-[0.6em] text-white/20 ml-2">Assembling Logic</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Complexity Stats */}
            {(activeStats || isAnalyzing) && (
                <div className="flex items-center justify-between border-t border-[#111] bg-[#050505] px-8 py-4 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Time Complexity</span>
                            {isAnalyzing ? (
                                <div className="h-3 w-16 bg-white/10 rounded-full animate-pulse mt-0.5" />
                            ) : (
                                <span className={`text-xs font-black uppercase tracking-widest ${aiMode && aiComplexity ? 'text-purple-400' : 'text-[#00a3ff]'}`}>
                                    {activeStats?.time || '-'}
                                </span>
                            )}
                        </div>

                        <div className="w-px h-6 bg-[#1a1a1a]" />

                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Space Complexity</span>
                            {isAnalyzing ? (
                                <div className="h-3 w-16 bg-white/10 rounded-full animate-pulse mt-0.5" />
                            ) : (
                                <span className={`text-xs font-black uppercase tracking-widest ${aiMode && aiComplexity ? 'text-purple-400' : 'text-purple-400'}`}>
                                    {activeStats?.space || '-'}
                                </span>
                            )}
                        </div>

                    </div>

                    <div className="flex items-center gap-2 px-8 py-2 rounded-lg border border-white/5">
                        <span className="font-bold text-gray-200 uppercase tracking-widest text-sm">Run Time :</span>
                        <div className="h-3 w-px " />
                        <span className="text-xs font-black uppercase tracking-widest text-[#32a852]">
                            {executionTime ? `${executionTime}ms` : '-'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

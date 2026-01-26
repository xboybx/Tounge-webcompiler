'use client';

import { Terminal, AlertCircle, CheckCircle, Clock, Layout, Columns, Rows } from 'lucide-react';
import { motion } from 'framer-motion';

interface OutputPanelProps {
    output: string;
    error: string | null;
    isRunning: boolean;
    executionTime: number | null;
    terminalPosition: 'right' | 'bottom';
    onTogglePosition: () => void;
}

export default function OutputPanel({
    output,
    error,
    isRunning,
    executionTime,
    terminalPosition,
    onTogglePosition
}: OutputPanelProps) {
    return (
        <div className="flex h-full flex-col bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-semibold text-zinc-300">Output Console</span>
                    </div>

                    <button
                        onClick={onTogglePosition}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all text-[10px] font-bold uppercase tracking-wider border border-zinc-800"
                        title={terminalPosition === 'right' ? "Move to Bottom" : "Move to Right"}
                    >
                        {terminalPosition === 'right' ? <Rows size={12} /> : <Columns size={12} />}
                        {terminalPosition === 'right' ? "Bottom" : "Side"}
                    </button>
                </div>
                {executionTime !== null && !isRunning && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{executionTime}ms</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {isRunning ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 text-blue-400"
                    >
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                        <span>Compiling and executing code...</span>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-start gap-2 text-red-400">
                            <AlertCircle className="mt-1 h-5 w-5 shrink-0" />
                            <div>
                                <div className="font-semibold">Compilation/Runtime Error:</div>
                                <pre className="mt-2 whitespace-pre-wrap text-red-300">{error}</pre>
                            </div>
                        </div>
                    </motion.div>
                ) : output ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-semibold">Execution Successful</span>
                        </div>
                        <pre className="mt-3 whitespace-pre-wrap text-zinc-300">{output}</pre>
                    </motion.div>
                ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                        <div className="text-center">
                            <Terminal className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <p className="text-sm">No output yet</p>
                            <p className="mt-1 text-xs">Click "Run Code" to execute your program</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

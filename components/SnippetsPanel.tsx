'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Snippet {
    _id: string;
    title: string;
    description?: string;
    language: string;
    code: string;
    tags?: string[];
    createdAt: string;
}

interface SnippetsPanelProps {
    onLoadSnippet: (code: string, language: string) => void;
    isExpanded: boolean;
    refreshTrigger?: number;
}

export default function SnippetsPanel({
    onLoadSnippet,
    isExpanded,
    refreshTrigger
}: SnippetsPanelProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSnippets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/snippets?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setSnippets(data.data);
            }
        } catch (error) {
            console.error('Error fetching snippets:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (isExpanded) {
            fetchSnippets();
        }
    }, [searchQuery, isExpanded, refreshTrigger, fetchSnippets]);

    const handleDeleteSnippet = async (id: string) => {
        if (!confirm('Eliminate this snippet?')) return;

        try {
            const response = await fetch(`/api/snippets/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                fetchSnippets();
            }
        } catch (error) {
            console.error('Error deleting snippet:', error);
        }
    };

    return (
        <div className="flex h-full flex-col bg-black text-white">
            <div className="flex h-16 items-center justify-between border-b border-[#111] px-6 shrink-0">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Repository</span>
            </div>

            <div className="p-6 space-y-4 border-b border-[#111]">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-[#888] transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#050505] border border-[#222] rounded-lg py-3 pl-12 pr-4 text-xs font-bold tracking-widest text-white placeholder-[#222] focus:border-white outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 custom-scrollbar space-y-4">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                    </div>
                ) : snippets.length === 0 ? (
                    <div className="flex h-full items-center justify-center opacity-10 py-12">
                        <span className="text-xs font-bold uppercase tracking-[0.4em] text-white">Empty</span>
                    </div>
                ) : (
                    snippets.map((snippet) => (
                        <motion.div
                            key={snippet._id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group relative p-5 rounded-xl border border-[#111] bg-[#050505] hover:border-white/20 hover:bg-[#111] transition-all cursor-pointer active:scale-[0.98]"
                            onClick={() => onLoadSnippet(snippet.code, snippet.language)}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate transition-colors uppercase tracking-tight">{snippet.title}</h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-mono text-[#888] uppercase tracking-widest font-bold">{snippet.language}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSnippet(snippet._id);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-[#222] text-[#444] hover:text-[#ee0000] transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

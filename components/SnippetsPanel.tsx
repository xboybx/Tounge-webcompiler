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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors z-10" size={16} strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] focus:border-white/30 rounded-none pl-12 pr-4 text-xs font-bold tracking-widest text-white/80 placeholder-white/20 focus:bg-[#202020] outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 custom-scrollbar space-y-4">
                {loading ? (
                    <div className="flex h-32 items-center justify-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Loading Archive</span>
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
                            className="group relative p-6 rounded-none border border-[#111] bg-[#050505] hover:border-white/20 hover:bg-[#111] transition-all cursor-pointer active:scale-[0.98]"
                            onClick={() => onLoadSnippet(snippet.code, snippet.language)}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSnippet(snippet._id);
                                }}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#222] text-[#444] hover:text-[#ee0000] opacity-0 group-hover:opacity-100 transition-all z-10"
                                title="Delete Snippet"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>

                            <div className="flex flex-col gap-1 pr-6">
                                <h3 className="text-sm font-bold text-white truncate uppercase tracking-tight">{snippet.title}</h3>
                                <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold mt-1 group-hover:text-[#888] transition-colors">
                                    {snippet.language}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

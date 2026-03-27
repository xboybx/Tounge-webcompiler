'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import Tooltip from '@/components/ui/Tooltip';

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
    onEditSnippet: (snippet: Snippet) => void;
    activeSnippetId?: string | null;
    isExpanded: boolean;
    refreshTrigger?: number;
}

export default function SnippetsPanel({
    onLoadSnippet,
    onEditSnippet,
    activeSnippetId,
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
        if (!confirm('Delete this snippet?')) return;

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
        <div className="flex h-full flex-col bg-black text-white ">
            <div className="flex h-16 items-center justify-between border-b border-[#111] px-4 shrink-0">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Repository</span>
            </div>

            <div className=" space-y-4 border-b border-[#111] mb-1 ">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] focus:border-white/30 rounded-none px-4 text-xs font-bold tracking-widest text-white/80 placeholder-white/20 focus:bg-[#202020] outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto  custom-scrollbar space-y-4">
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
                            className={`group relative pl-2 rounded-none border ${activeSnippetId === snippet._id ? 'border-[#00a3ff] bg-black' : 'border-[#111] bg-[#050505]'} hover:border-white/20 hover:bg-[#111] transition-all cursor-pointer active:scale-[0.98]`}
                            onClick={() => onLoadSnippet(snippet.code, snippet.language)}
                        >
                            <div className={`absolute top-4 right-4 flex gap-2 ${activeSnippetId === snippet._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all z-10`}>
                                <Tooltip content="Edit Snippet" position="left">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditSnippet(snippet);
                                        }}
                                        className={`p-2 rounded-lg hover:bg-[#222] ${activeSnippetId === snippet._id ? 'text-[#00a3ff]' : 'text-[#444]'} hover:text-[#00a3ff] transition-all`}
                                    >
                                        <Pencil size={14} strokeWidth={3} />
                                    </button>
                                </Tooltip>
                                <Tooltip content="Delete Snippet" position="left">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSnippet(snippet._id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-[#222] text-[#444] hover:text-[#ee0000] transition-all"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </Tooltip>
                            </div>

                            <div className="flex flex-col gap-1 pr-2">
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

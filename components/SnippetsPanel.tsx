'use client';

import { useState, useEffect } from 'react';
import { Save, X, Search, Tag, Calendar, Menu, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    currentCode: string;
    currentLanguage: string;
    isExpanded: boolean;
    onToggle: () => void;
}

export default function SnippetsPanel({
    onLoadSnippet,
    currentCode,
    currentLanguage,
    isExpanded,
    onToggle
}: SnippetsPanelProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLanguage, setFilterLanguage] = useState<string>('');

    const [newSnippet, setNewSnippet] = useState({
        title: '',
        description: '',
        tags: '',
    });

    const fetchSnippets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterLanguage) params.append('language', filterLanguage);
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
    };

    useEffect(() => {
        if (isExpanded) {
            fetchSnippets();
        }
    }, [filterLanguage, searchQuery, isExpanded]);

    const handleSaveSnippet = async () => {
        if (!newSnippet.title) {
            alert('Please enter a title');
            return;
        }

        try {
            const response = await fetch('/api/snippets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newSnippet.title,
                    description: newSnippet.description,
                    language: currentLanguage,
                    code: currentCode,
                    tags: newSnippet.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowSaveDialog(false);
                setNewSnippet({ title: '', description: '', tags: '' });
                fetchSnippets();
                alert('✅ Snippet saved successfully!');
            } else {
                alert('❌ ' + (data.error || 'Failed to save snippet. Is MongoDB running?'));
            }
        } catch (error) {
            console.error('Error saving snippet:', error);
            alert('❌ Failed to save snippet. Please check if MongoDB is running.\n\nSee SETUP.md for instructions.');
        }
    };

    const handleDeleteSnippet = async (id: string) => {
        if (!confirm('Are you sure you want to delete this snippet?')) return;

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

    const languages = Array.from(new Set(snippets.map(s => s.language)));

    return (
        <div className="flex h-full flex-col bg-zinc-950 text-zinc-300 transition-all duration-300 ease-in-out">
            {/* Header & Toggle */}
            <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggle}
                        className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
                        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        <Menu size={20} />
                    </button>

                    {isExpanded && (
                        <div className="flex items-center justify-between flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
                                Libs
                            </h2>
                            <button
                                onClick={() => setShowSaveDialog(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                                title="Save current code to library"
                            >
                                <Save size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* Filters Section */}
                    <div className="border-b border-zinc-800 p-5 space-y-4 bg-zinc-900/20">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-zinc-300 placeholder-zinc-600 focus:border-blue-600/50 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={filterLanguage}
                                onChange={(e) => setFilterLanguage(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 text-xs text-zinc-400 focus:border-blue-600/50 focus:outline-none focus:ring-4 focus:ring-blue-600/5 cursor-pointer hover:bg-zinc-900 transition-all font-bold uppercase tracking-widest appearance-none"
                            >
                                <option value="">All Languages</option>
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                <Tag size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {loading ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-4 text-zinc-500">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Syncing Data</span>
                            </div>
                        ) : snippets.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-5 px-6 opacity-40 grayscale py-12">
                                <div className="p-6 rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800">
                                    <Save className="h-10 w-10 text-zinc-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Database Empty</p>
                                    <p className="mt-2 text-[10px] uppercase tracking-tighter opacity-70">Save your first snippet to get started</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-5 pb-12">
                                {snippets.map((snippet) => (
                                    <motion.div
                                        key={snippet._id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-black/40 active:scale-[0.99]"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-zinc-100 truncate text-sm group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-tight mb-1">{snippet.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2 py-0.5 text-[8px] font-black text-blue-400 uppercase tracking-[0.1em] border border-blue-500/20">
                                                            {snippet.language}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-600 font-bold uppercase">{new Date(snippet.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => onLoadSnippet(snippet.code, snippet.language)}
                                                        className="rounded-xl bg-blue-600/10 p-2.5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        title="Launch Script"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSnippet(snippet._id)}
                                                        className="rounded-xl bg-red-600/10 p-2.5 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        title="Wipe Permanent"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {snippet.tags && snippet.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {snippet.tags.map((tag, i) => (
                                                        <span key={i} className="text-[8px] font-black text-zinc-600 bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800 transition-all group-hover:border-zinc-700/50 group-hover:text-zinc-500 uppercase tracking-widest">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                        onClick={() => setShowSaveDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                                        <div className="p-2.5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/40">
                                            <Save size={20} className="text-white" />
                                        </div>
                                        Archive Snippet
                                    </h3>
                                    <p className="mt-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">Build your personal library</p>
                                </div>
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="rounded-2xl p-3 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Archive Title</label>
                                    <input
                                        type="text"
                                        value={newSnippet.title}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all placeholder-zinc-700"
                                        placeholder="e.g. DATA CONVERTER"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Context / Logic</label>
                                    <textarea
                                        value={newSnippet.description}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                                        rows={2}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all resize-none placeholder-zinc-700"
                                        placeholder="Brief technical notes..."
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">System Tags</label>
                                    <input
                                        type="text"
                                        value={newSnippet.tags}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all placeholder-zinc-700"
                                        placeholder="react, api, auth..."
                                    />
                                </div>

                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.1em]">
                                        Detected Engine: <span className="text-blue-400">{currentLanguage}</span>
                                    </span>
                                </div>

                                <button
                                    onClick={handleSaveSnippet}
                                    className="w-full rounded-2xl bg-blue-600 py-5 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-500 active:scale-[0.98] shadow-2xl shadow-blue-900/40"
                                >
                                    Commit to Library
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

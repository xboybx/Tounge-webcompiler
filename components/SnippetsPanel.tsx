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
        <div className="flex h-full flex-col bg-zinc-950 text-zinc-300 transition-all duration-300">
            <div className="border-b border-zinc-800 p-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggle}
                        className={`p-2 rounded-md transition-colors ${isExpanded ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                        title={isExpanded ? "Collapse" : "Expand Snippets"}
                    >
                        <Menu size={20} />
                    </button>

                    {isExpanded && (
                        <>
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 flex-1">
                                Snippets
                            </h2>
                            <button
                                onClick={() => setShowSaveDialog(true)}
                                className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-blue-600 transition-colors"
                                title="Save Current"
                            >
                                <Save size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="border-b border-zinc-800 p-3 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search snippets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                        </div>

                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                            <option value="">All Languages</option>
                            {languages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
                                Loading snippets...
                            </div>
                        ) : snippets.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center text-zinc-500">
                                <Save className="h-12 w-12 opacity-50" />
                                <p className="text-sm">No snippets found</p>
                                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
                                    <p className="font-semibold text-zinc-400">💡 Note:</p>
                                    <p className="mt-1">Snippets require MongoDB Atlas or local MongoDB.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {snippets.map((snippet) => (
                                    <motion.div
                                        key={snippet._id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-zinc-200 truncate text-sm">{snippet.title}</h3>
                                                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
                                                    <span className="rounded bg-zinc-800 px-1.5 py-0.5">{snippet.language}</span>
                                                    <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onLoadSnippet(snippet.code, snippet.language)}
                                                    className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                                                    title="Load"
                                                >
                                                    <Play size={12} fill="currentColor" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSnippet(snippet._id)}
                                                    className="rounded bg-red-600 p-1 text-white hover:bg-red-700"
                                                    title="Delete"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowSaveDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                                    <Save size={18} className="text-blue-500" />
                                    Save Snippet
                                </h3>
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Title</label>
                                    <input
                                        type="text"
                                        value={newSnippet.title}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        placeholder="My function..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={newSnippet.description}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                                        rows={2}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                                        placeholder="Optional description"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</label>
                                    <input
                                        type="text"
                                        value={newSnippet.tags}
                                        onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        placeholder="react, utils"
                                    />
                                </div>

                                <div className="text-[10px] text-zinc-500">
                                    Language detected: <span className="font-bold text-blue-400 capitalize">{currentLanguage}</span>
                                </div>

                                <button
                                    onClick={handleSaveSnippet}
                                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-900/20"
                                >
                                    Save Snippet
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

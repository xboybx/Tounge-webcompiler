'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    PaperAirplaneIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon
} from '@heroicons/react/24/solid';
import { marked } from 'marked';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

import { useChat } from '@/components/providers/ChatContext';

export default function FloatingChat() {
    const { isOpen, closeChat: onClose } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your Toungestant. Stuck on a DSA problem? Need a complexity check? Ask away!",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    // In a real app, you'd grab this from a context store (Zustand/Redux) or prop.
                    // For now, we rely on the user asking specific questions or pasting snippets.
                    contextCode: ""
                })
            });

            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "I'm having trouble connecting to the mainframe right now.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Error: Could not reach the AI service.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-100 flex flex-col items-end pointer-events-none font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Smooth cubic-bezier
                        className={`pointer-events-auto mb-6 flex flex-col overflow-hidden origin-bottom-right transition-all duration-500 ease-spring ${isExpanded ? 'w-[550px] h-[550px]' : 'w-[340px] h-[250px]'}`}
                        style={{
                            background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.0) 0%, rgba(15, 15, 25, 0.85) 40%, rgba(15, 15, 25, 0.95) 100%)', // Gradient BG to blend top
                            backdropFilter: 'blur(12px) saturate(180%)',
                            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
                            borderRadius: '32px',
                        }}
                    >
                        {/* Header (Minimal/Transparent) */}
                        <div className="flex items-center justify-between px-10 pt-5 pb-2 shrink-0 group/header">
                            <div className="flex items-center gap-3 transition-opacity duration-500">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">AI Context</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 transition-opacity duration-500">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? (
                                        <ArrowsPointingInIcon className="w-4 h-4" />
                                    ) : (
                                        <ArrowsPointingOutIcon className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => onClose()}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area - Faded Top */}
                        <div
                            className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar scroll-smooth"
                            style={{
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)'
                            }}
                        >
                            {/* Spacer to push content down if few messages */}
                            <div className="h-4" />

                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[90%] px-5 py-3.5 text-sm leading-6 tracking-wide shadow-sm ${msg.role === 'user'
                                            ? 'bg-[#1a1a1a]/80 text-white backdrop-blur-md rounded-[24px] rounded-br-sm'
                                            : 'text-gray-100/90 rounded-[24px] rounded-bl-sm'
                                            }`}
                                    >
                                        <div
                                            className="prose prose-invert prose-p:my-1 prose-pre:bg-[#000]/30 prose-pre:backdrop-blur-md prose-pre:border-none max-w-none"
                                            dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }}
                                        />
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="px-5 py-4">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[10px] font-bold text-[#FF6D5A] uppercase tracking-widest animate-pulse">Computing</span>
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#FF6D5A] border-t-transparent" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Integrated */}
                        <form onSubmit={handleSubmit} className="px-14 pb-6 pt-2">
                            <div className="relative flex items-center group">
                                <div className="absolute inset-0 bg-linear-to-r from-[#FF6D5A]/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask code-craft..."
                                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/20 rounded-3xl pl-6 pr-14 py-5 focus:outline-none focus:bg-[#222] transition-all font-medium text-[14px] backdrop-blur-sm shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isTyping}
                                    className="absolute right-2 p-2 bg-white/5 hover:bg-[#FF6D5A] text-white/40 hover:text-white rounded-full transition-all disabled:opacity-0 active:scale-95"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

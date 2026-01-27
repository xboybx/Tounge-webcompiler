'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    PaperAirplaneIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    CpuChipIcon,
    ClipboardDocumentIcon,
    CheckIcon
} from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChat } from '@/components/providers/ChatContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// ----------------------------------------------------------------------
// Minimal Code Block Component with Copy Functionality
// ----------------------------------------------------------------------
const MinimalCodeBlock = ({ language, children, isExpanded, ...props }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 rounded-md overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-xl relative group">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a] border-b border-white/5 select-none data-[expanded=false]:py-1">
                <span className={`uppercase font-mono tracking-wider text-white/40 font-semibold ${isExpanded ? 'text-[10px]' : 'text-[8px]'}`}>
                    {language || 'Terminal'}
                </span>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors group/btn"
                >
                    {copied ? (
                        <>
                            <CheckIcon className={`text-emerald-400 ${isExpanded ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
                            <span className={`text-emerald-400 font-medium ${isExpanded ? 'text-[10px]' : 'text-[8px]'}`}>Copied</span>
                        </>
                    ) : (
                        <>
                            <ClipboardDocumentIcon className={`text-white/30 group-hover/btn:text-white/70 transition-colors ${isExpanded ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
                            <span className={`text-white/30 group-hover/btn:text-white/70 transition-colors ${isExpanded ? 'text-[10px]' : 'text-[8px]'}`}>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Syntax Highlighter */}
            <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: isExpanded ? '1rem' : '0.75rem',
                    fontSize: isExpanded ? '12px' : '10px',
                    lineHeight: '1.6',
                    background: 'rgba(0,0,0,0.2)', // Slightly transparent
                }}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

export default function FloatingChat() {
    const { isOpen, closeChat: onClose } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "## Explore Tounge!",
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
    }, [messages, isTyping]);

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
                    contextCode: ""
                })
            });

            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "⚠️ **Connection Error**: Neural link unstable.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "❌ **Critical Error**: Network unreachable.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Dynamic Sizing Classes
    const headerTextClass = isExpanded ? 'text-sm' : 'text-xs';
    const startPromptSize = isExpanded ? 'text-sm' : 'text-[11px]'; // Slightly smaller than sm
    const messageTextClass = isExpanded ? 'text-[15px]' : 'text-xs'; // Base legible size vs compact

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-none font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                        // Glassmorphism Container
                        className={`pointer-events-auto mb-6 flex flex-col overflow-hidden origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'w-[800px] h-[700px]' : 'w-[360px] h-[450px]'}`}
                        style={{
                            // Deep glass effect
                            background: 'rgba(12, 12, 14, 0.70)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Header - Glassy & Dynamic Size */}
                        <div className={`flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 backdrop-blur-3xl bg-white/[0.03] transition-all duration-500`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 bg-yellow-500/10 rounded-md shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all ${isExpanded ? 'scale-100' : 'scale-90'}`}>
                                    <CpuChipIcon className={`${isExpanded ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-bold text-white tracking-wide transition-all ${headerTextClass}`}>Tounge AI</span>
                                    {isExpanded && (
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            SYSTEM ONLINE
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                                >
                                    {isExpanded ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => onClose()}
                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-white/40"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area - Glassy content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar scroll-smooth">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] leading-relaxed shadow-lg backdrop-blur-md transition-all duration-500 ${msg.role === 'user'
                                            ? 'bg-[#2A2A2A]/40 text-white rounded-2xl rounded-tr-sm px-5 py-3 border border-white/10'
                                            : 'text-gray-200'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div className={`markdown-body ${msg.id === 'welcome' ? startPromptSize : messageTextClass}`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // Use external Code Block component
                                                        code(props) {
                                                            const { children, className, node, ...rest } = props
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            return match ? (
                                                                <MinimalCodeBlock
                                                                    language={match[1]}
                                                                    isExpanded={isExpanded}
                                                                    {...rest}
                                                                >
                                                                    {children}
                                                                </MinimalCodeBlock>
                                                            ) : (
                                                                <code {...rest} className={`px-1.5 py-0.5 rounded-md bg-white/10 text-[#FFD700] font-mono border border-white/5 ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        },
                                                        ul({ children }) { return <ul className="list-disc pl-4 my-2 space-y-1 text-gray-300/90">{children}</ul> },
                                                        ol({ children }) { return <ol className="list-decimal pl-4 my-2 space-y-1 text-gray-300/90">{children}</ol> },
                                                        h3({ children }) {
                                                            return <h3 className={`${isExpanded ? 'text-base' : 'text-sm'} font-bold text-white mt-5 mb-3 flex items-center gap-2 border-l-2 border-[#FFD700] pl-3`}>{children}</h3>
                                                        },
                                                        p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed text-gray-200/90">{children}</p> },
                                                        strong({ children }) { return <strong className="font-bold text-white shadow-[#FFD700]/20 drop-shadow-sm">{children}</strong> }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className={`${isExpanded ? 'text-sm' : 'text-xs'}`}>{msg.content}</div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-3 pl-2"
                                >
                                    <div className={`flex gap-1 bg-white/5 border border-white/5 rounded-full items-center backdrop-blur-sm transition-all ${isExpanded ? 'h-8 px-4' : 'h-6 px-3'}`}>
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                                    </div>
                                    <span className={`${isExpanded ? 'text-xs' : 'text-[10px]'} text-white/30 font-mono animate-pulse uppercase tracking-wider`}>Calculating...</span>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Glassy */}
                        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your command..."
                                    className={`w-full bg-[#000]/20 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#FFD700]/30 focus:bg-[#000]/40 transition-all font-medium backdrop-blur-sm shadow-inner ${isExpanded ? 'pl-4 pr-12 py-4 text-sm' : 'pl-3 pr-10 py-3 text-xs'}`}
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isTyping}
                                    className={`absolute right-2 bg-[#FFD700] hover:bg-[#F0C000] text-black rounded-lg transition-all disabled:opacity-0 disabled:scale-75 active:scale-95 shadow-lg shadow-[#FFD700]/20 ${isExpanded ? 'p-2' : 'p-1.5'}`}
                                >
                                    <PaperAirplaneIcon className={`${isExpanded ? 'w-4 h-4' : 'w-3 h-3'}`} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

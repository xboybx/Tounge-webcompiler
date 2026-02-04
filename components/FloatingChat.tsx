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
    CheckIcon,
    PlusIcon,
    StopIcon,
    TrashIcon
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
    const { isOpen, closeChat: onClose, editorCode } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCodeAttached, setIsCodeAttached] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load messages from LocalStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('tounge_chat_history');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                // Ensure dates are parsed back to Date objects if needed, though for display strings are usually fine.
                // If timestamp logic relies on Date object methods, we might need reconstruction.
                // For this UI, simple strings/rendering is used, so strictly parsing back to Date isn't critical unless sort depends on it.
                // But let's be safe if we rely on Date elsewhere.
                setMessages(parsed);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save messages to LocalStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('tounge_chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Handle ESC to close and 'f' to Toggle Maximize/Minimize
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle Maximize/Minimize on 'Ctrl+F'
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault(); // Prevent Browser "Find"
                setIsExpanded(prev => !prev);
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        localStorage.removeItem('tounge_chat_history');
        setMessages([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Abort previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        // UI Update 1: Add User Message
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setQuery('');
        setIsTyping(true);

        // Create placeholder AI message
        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: Message = {
            id: aiMsgId,
            role: 'assistant',
            content: '', // Start empty
            timestamp: new Date()
        };

        setMessages(prev => [...prev, initialAiMsg]);

        try {
            // Prepare context history (last 10 messages to save tokens/overhead)
            // Filter out the 'welcome' message if it's programmatic, keeping mostly real turns
            const contextMessages = newHistory
                .filter(m => m.id !== 'welcome')
                .slice(-10) // Keep last 10
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: contextMessages, // Send History
                    contextCode: isCodeAttached ? editorCode : ""
                }),
                signal: controller.signal
            });

            // Reset attachment after send? Maybe keep it? Let's reset for now to avoid accidental resends.
            setIsCodeAttached(false);

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                aiContent += text;

                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: aiContent } : msg
                ));
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted by user');
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: msg.content + " [Stopped]" } : msg
                ));
            } else {
                console.error("Stream Error:", error);
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: msg.content + "\n\n❌ **Network Error**: Connection lost." } : msg
                ));
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    // Dynamic Sizing Classes
    const startPromptSize = isExpanded ? 'text-sm' : 'text-[11px]';
    const messageTextClass = isExpanded ? 'text-[15px]' : 'text-xs';

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-none font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                        // Glassmorphism Container
                        className={`pointer-events-auto mb-6 flex flex-col relative overflow-hidden origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'w-[800px] h-[700px]' : 'w-[400px] h-[500px]'} bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-lg`}
                        style={{
                            // Glass effect handled by classes
                        }}
                    >
                        {/* Minimal Header - Totally Floating */}
                        <div className="absolute top-0 right-0 z-30 flex items-center gap-2 p-4" >
                            <div className="flex items-center gap-1.5 p-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-opacity hover:opacity-100 opacity-60">
                                <button
                                    onClick={clearHistory}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                                    title="Clear Chat History"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                                >
                                    {isExpanded ? <ArrowsPointingInIcon className="w-3.5 h-3.5" /> : <ArrowsPointingOutIcon className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => onClose()}
                                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-white/70"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>



                        <div
                            className="flex-1 overflow-y-auto px-6 pt-24 pb-4 space-y-6 custom-scrollbar scroll-smooth relative"
                            style={{
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
                                marginTop: '1rem',
                            }}
                        >
                            {messages.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 select-none pointer-events-none p-8">
                                    <h2 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase relative">
                                        Explore Tounge!
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#06B6D4] rounded-full shadow-[0_0_20px_#06B6D4]"></div>
                                    </h2>
                                    <ul className="space-y-3 text-sm font-medium text-gray-400">
                                        <li className="flex items-center gap-2 justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                                            Analyze Complexity
                                        </li>
                                        <li className="flex items-center gap-2 justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                                            Debug Runtime Errors
                                        </li>
                                        <li className="flex items-center gap-2 justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                                            Refactor Code
                                        </li>
                                    </ul>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[98%] leading-relaxed transition-all duration-500 relative group shadow-xl                                        ${msg.role === 'user'
                                            // User: Small, Ocean Blue Accent, Floating Box
                                            ? 'bg-[#0a0a0a] text-white rounded-[20px] rounded-tr-sm p-14 border border-[#06B6D4]/20 overflow-x-scroll '
                                            : 'bg-[#0f0f0f] text-gray-200 rounded-[20px] rounded-tl-sm px-6 py-5 border border-white/5  overflow-x-scroll' // AI: Dark Box
                                            }`} style={{ marginLeft: '1rem', marginRight: '1rem', marginBottom: '1rem', padding: '0.7rem' }}
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
                                                                <div className="my-5 rounded-lg overflow-hidden border border-white/10 shadow-inner bg-black/30">
                                                                    <MinimalCodeBlock
                                                                        language={match[1]}
                                                                        isExpanded={isExpanded}
                                                                        {...rest}
                                                                    >
                                                                        {children}
                                                                    </MinimalCodeBlock>
                                                                </div>
                                                            ) : (
                                                                <code {...rest} className={`px-1.5 py-0.5 rounded-md bg-white/10 text-[#06B6D4] font-mono border border-white/5 ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        },
                                                        ul({ children }) { return <ul className="list-disc pl-4 my-4 space-y-2 text-gray-300/90">{children}</ul> },
                                                        ol({ children }) { return <ol className="list-decimal pl-4 my-4 space-y-2 text-gray-300/90">{children}</ol> },
                                                        h3({ children }) {
                                                            return <h3 className={`${isExpanded ? 'text-lg' : 'text-base'} font-bold text-white mt-8 mb-4 flex items-center gap-2`}>
                                                                <span className="w-1 h-4 bg-[#06B6D4] rounded-full shadow-[0_0_10px_#06B6D4]"></span>
                                                                {children}
                                                            </h3>
                                                        },
                                                        p({ children }) { return <p className="mb-5 last:mb-0 leading-7 text-gray-300 font-light tracking-wide">{children}</p> },
                                                        strong({ children }) { return <strong className="font-semibold text-white">{children}</strong> }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className={`${isExpanded ? 'text-sm' : 'text-xs'} font-medium tracking-wide`}>{msg.content}</div>
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
                                    <span className={`${isExpanded ? 'text-xs' : 'text-[10px]'} text-[#06B6D4] font-mono animate-pulse uppercase tracking-wider flex items-center gap-2`}>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06B6D4] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06B6D4]"></span>
                                        </span>
                                        Thinking...
                                    </span>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="w-full pb-6 pt-2 z-20 flex justify-center">
                            <form onSubmit={handleSubmit} className="relative group w-[98%] " style={{ marginBottom: '1rem', }}>
                                <div className={`absolute -inset-[1px] bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent rounded-[24px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm`} />
                                <div className={`relative flex items-center bg-[#151515] border border-white/10 rounded-[22px] shadow-2xl transition-all duration-300 group-focus-within:border-[#06B6D4]/40 group-focus-within:bg-[#1a1a1a] ${isExpanded ? 'p-2' : 'p-1.5'}`}>

                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={isCodeAttached ? "Ask about current code..." : "Ask Tounge..."}
                                        className={`w-full bg-transparent text-white placeholder-white/20 focus:outline-none transition-all font-light tracking-wide px-4 ${isExpanded ? 'text-sm' : 'text-xs'}`}
                                        style={{ padding: '0.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsCodeAttached(!isCodeAttached)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 mr-2 ${isCodeAttached ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
                                    >
                                        {isCodeAttached ? <CheckIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isCodeAttached ? 'text-[#06B6D4]' : ''}`}>Code</span>
                                    </button>
                                    <button
                                        type={isTyping ? "button" : "submit"}
                                        onClick={isTyping ? handleStop : undefined}
                                        disabled={!isTyping && !query.trim()}
                                        className={`shrink-0 flex items-center justify-center bg-white/10 hover:bg-[#06B6D4] hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white/50 rounded-xl transition-all duration-300 disabled:opacity-0 disabled:scale-75 active:scale-95 ${isExpanded ? 'w-10 h-10' : 'w-8 h-8'}`}
                                    >
                                        {isTyping ? (
                                            <StopIcon className="w-4 h-4" />
                                        ) : (
                                            <PaperAirplaneIcon className={`w-4 h-4 -rotate-45 translate-x-0.5 translate-y-[-1px]`} />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

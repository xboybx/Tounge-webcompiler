'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PaperAirplaneIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    PlusIcon,
    StopIcon,
    TrashIcon
} from '@heroicons/react/24/solid';
import Tooltip from '@/components/ui/Tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChat } from '@/components/providers/ChatProvider';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const MinimalCodeBlock = ({ language, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 rounded-md overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-xl relative group w-full">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a] border-b border-white/5 select-none">
                <span className="uppercase font-mono tracking-wider text-white/40 font-semibold text-[10px]">
                    {language || 'Terminal'}
                </span>

                <Tooltip content={copied ? "Copied!" : "Copy Code"} position="left">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors group/btn"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="text-emerald-400 w-3 h-3" />
                                <span className="text-emerald-400 font-medium text-[10px]">Copied</span>
                            </>
                        ) : (
                            <>
                                <ClipboardDocumentIcon className="text-white/30 group-hover/btn:text-white/70 transition-colors w-3 h-3" />
                                <span className="text-white/30 group-hover/btn:text-white/70 transition-colors text-[10px]">Copy</span>
                            </>
                        )}
                    </button>
                </Tooltip>
            </div>

            <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '11px',
                    lineHeight: '1.6',
                    background: 'rgba(0,0,0,0.2)',
                    maxWidth: '100%',
                    overflowX: 'auto',
                }}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

export default function ChatSidebar() {
    const { editorCode } = useChat();
    const [isCodeAttached, setIsCodeAttached] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const savedMessages = localStorage.getItem('tounge_chat_history');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                setMessages(parsed);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('tounge_chat_history', JSON.stringify(messages));
        } else {
            localStorage.removeItem('tounge_chat_history');
        }
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

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

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setQuery('');
        setIsTyping(true);

        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: Message = {
            id: aiMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, initialAiMsg]);

        try {
            const contextMessages = newHistory
                .filter(m => m.id !== 'welcome')
                .slice(-10)
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: contextMessages,
                    contextCode: isCodeAttached ? editorCode : ""
                }),
                signal: controller.signal
            });

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
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: msg.content + " [Stopped]" } : msg
                ));
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: msg.content + "\n\n❌ **Network Error**: Connection lost." } : msg
                ));
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050505] font-sans relative">
            {/* Header */}
            <div
                className="py-2 px-4  bg-[#0A0A0A] flex items-center justify-between shrink-0"
            >
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_10px_#06B6D4]"></span>
                    <h2 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Tounge Copilot</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content="Clear History" position="bottom">
                        <button
                            onClick={clearHistory}
                            className="p-1.5 hover:bg-[#222] rounded-md transition-colors text-white/50 hover:text-white"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar scroll-smooth px-4 "
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none pointer-events-none p-4">
                        <h2 className="text-xl font-black text-white mb-4 tracking-tighter uppercase relative">
                            Ask Something
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#06B6D4] rounded-full shadow-[0_0_20px_#06B6D4]"></div>
                        </h2>
                        <ul className="space-y-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            <li>Analyze Code</li>
                            <li>Debug Errors</li>
                            <li>Write Examples</li>
                        </ul>
                    </div>
                )}
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`flex-1 leading-relaxed rounded-xl px-[9px] py-[6px] shadow-sm ${msg.role === 'user'
                                ? ``
                                : 'bg-transparent text-gray-300'
                                }`}
                            style={{
                                width: msg.role === 'assistant' ? '100%' : 'auto',
                            }}
                        >
                            {msg.role === 'assistant' ? (
                                <div className="markdown-body text-[12px] md:text-[13px] w-full max-w-full overflow-hidden">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code(props) {
                                                const { children, className, node, ...rest } = props
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <div className="my-4 rounded-lg overflow-hidden border border-[#222] bg-black">
                                                        <MinimalCodeBlock
                                                            language={match[1]}
                                                            {...rest}
                                                        >
                                                            {children}
                                                        </MinimalCodeBlock>
                                                    </div>
                                                ) : (
                                                    <code {...rest} className="px-1.5 py-0.5 rounded text-[#06B6D4] font-mono bg-[#111] text-[11px] border border-[#222]">
                                                        {children}
                                                    </code>
                                                )
                                            },
                                            ul({ children }) { return <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul> },
                                            ol({ children }) { return <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol> },
                                            h3({ children }) {
                                                return <h3 className="text-[13px] font-bold text-white mt-4 mb-2 flex items-center gap-2">
                                                    <span className="w-1 h-3 bg-[#06B6D4] rounded-full"></span>
                                                    {children}
                                                </h3>
                                            },
                                            p({ children }) { return <p className="mb-3 last:mb-0 leading-relaxed font-light">{children}</p> },
                                            strong({ children }) { return <strong className="font-semibold text-white">{children}</strong> }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-[12px] font-medium whitespace-pre-wrap">{msg.content}</div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pl-2"
                    >
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] bg-linear-to-r from-white/20 via-white to-white/20 bg-size-[200%_auto] bg-clip-text text-transparent animate-shimmer">
                            Thinking...
                        </span>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className='px-2'

            >
                <form onSubmit={handleSubmit} className="relative group w-full h-16">
                    <div className="relative flex items-center h-16 bg-[#111] border border-[#353333] rounded-xl transition-all duration-300 focus-within:border-[#06B6D4]/50 focus-within:bg-[#1a1a1a] px-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isCodeAttached ? "Ask about code..." : "Ask Copilot..."}
                            className="w-full bg-transparent text-white placeholder-[#555] focus:outline-none transition-all font-light tracking-wide px-3 text-[12px]"
                        />
                        <Tooltip content={isCodeAttached ? "Detach Code" : "Attach Code"} position="top">
                            <button
                                type="button"
                                onClick={() => setIsCodeAttached(!isCodeAttached)}
                                className={`shrink-0 flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 mr-1 ${isCodeAttached ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                {isCodeAttached ? <CheckIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <button
                            type={isTyping ? "button" : "submit"}
                            onClick={isTyping ? handleStop : undefined}
                            disabled={!isTyping && !query.trim()}
                            className="shrink-0 flex items-center justify-center bg-white/10 hover:bg-[#06B6D4] hover:text-black text-white/50 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-7 h-7"
                        >
                            {isTyping ? (
                                <StopIcon className="w-3.5 h-3.5" />
                            ) : (
                                <PaperAirplaneIcon className="-rotate-45 translate-x-px w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

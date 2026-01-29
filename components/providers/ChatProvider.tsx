'use client';

import React, { useState, ReactNode } from 'react';
import FloatingChat from '@/components/FloatingChat';
import { ChatContext } from './ChatContext';

export { useChat } from './ChatContext';

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);
    const toggleChat = () => setIsOpen((prev) => !prev);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shortcut: Ctrl+Q (or Cmd+Q) to Toggle Chat
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Removed isOpen from dependency array as it's not directly used in the effect's logic anymore, and setIsOpen with functional update doesn't need it.

    return (
        <ChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
            {children}
            <FloatingChat />
        </ChatContext.Provider>
    );
}

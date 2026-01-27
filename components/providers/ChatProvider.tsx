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

    return (
        <ChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
            {children}
            <FloatingChat />
        </ChatContext.Provider>
    );
}

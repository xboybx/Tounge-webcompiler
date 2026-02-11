'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming cn exists, checked FileExplorer imports

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    delay?: number;
}

export default function Tooltip({
    content,
    children,
    position = 'top',
    className = '',
    delay = 0.5
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const initialStyles = {
        top: { opacity: 0, y: 5, scale: 0.9, x: '-50%' },
        bottom: { opacity: 0, y: -5, scale: 0.9, x: '-50%' },
        left: { opacity: 0, x: 5, scale: 0.9, y: '-50%' },
        right: { opacity: 0, x: -5, scale: 0.9, y: '-50%' },
    };

    const animateStyles = {
        top: { opacity: 1, y: 0, scale: 1, x: '-50%' },
        bottom: { opacity: 1, y: 0, scale: 1, x: '-50%' },
        left: { opacity: 1, x: 0, scale: 1, y: '-50%' },
        right: { opacity: 1, x: 0, scale: 1, y: '-50%' },
    };

    // We need to handle styles specifically for Framer Motion to animate transform properties correctly without rewriting classes
    // However, classes like -translate-x-1/2 are static transforms. Framer motion overrides transform.
    // So we should remove transform classes from positionClasses and handle centering in motion styles

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={initialStyles[position]}
                        animate={{
                            ...animateStyles[position],
                            transition: { duration: 0.15, delay: delay }
                        }}
                        exit={{
                            ...initialStyles[position],
                            transition: { duration: 0.1, delay: 0 }
                        }}
                        className={cn(
                            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-zinc-900 border border-zinc-700/50 rounded shadow-xl whitespace-nowrap pointer-events-none backdrop-blur-sm",
                            // Positioning classes without transforms that conflict with motion
                            position === 'top' && "bottom-full left-1/2 mb-2",
                            position === 'bottom' && "top-full left-1/2 mt-2",
                            position === 'left' && "right-full top-1/2 mr-2",
                            position === 'right' && "left-full top-1/2 ml-2"
                        )}
                    >
                        {content}
                        {/* Arrow/Caret */}
                        <div
                            className={cn(
                                "absolute w-2 h-2 bg-zinc-900 border-zinc-700/50 rotate-45",
                                position === 'top' && "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r",
                                position === 'bottom' && "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l",
                                position === 'left' && "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r",
                                position === 'right' && "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l",
                            )}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

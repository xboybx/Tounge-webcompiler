'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Play, Square, RotateCcw, Trash2, Copy } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

export default function Terminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const executeCommand = (term: XTerm, command: string) => {
        const parts = command.split(' ');
        const cmd = parts[0];

        switch (cmd) {
            case 'clear':
                term.clear();
                break;
            case 'help':
                term.writeln('\x1b[1;36mAvailable Commands:\x1b[0m');
                term.writeln('  \x1b[1;32mclear\x1b[0m      - Clear the terminal');
                term.writeln('  \x1b[1;32mhelp\x1b[0m       - Show this help message');
                term.writeln('  \x1b[1;32mecho\x1b[0m       - Echo text to terminal');
                term.writeln('  \x1b[1;32mdate\x1b[0m       - Show current date/time');
                term.writeln('  \x1b[1;32mwhoami\x1b[0m     - Show current user');
                break;
            case 'echo':
                term.writeln(parts.slice(1).join(' '));
                break;
            case 'date':
                term.writeln(new Date().toString());
                break;
            case 'whoami':
                term.writeln('code-craft-user');
                break;
            default:
                if (command) {
                    term.writeln(`\x1b[1;31mCommand not found: ${cmd}\x1b[0m`);
                    term.writeln(`Type '\x1b[1;32mhelp\x1b[0m' for available commands`);
                }
        }
    };

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize terminal
        const term = new XTerm({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#0a0a0a',
                foreground: '#ededed',
                cursor: '#ededed',
                black: '#000000',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#bfbfbf',
                brightBlack: '#4d4d4d',
                brightRed: '#ff6e67',
                brightGreen: '#5af78e',
                brightYellow: '#f4f99d',
                brightBlue: '#caa9fa',
                brightMagenta: '#ff92d0',
                brightCyan: '#9aedfe',
                brightWhite: '#e6e6e6',
            },
            lineHeight: 1.2,
            scrollback: 1000,
            tabStopWidth: 4,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        // Welcome message
        term.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════╗\x1b[0m');
        term.writeln('\x1b[1;32m║     Welcome to Code Craft Terminal v1.0          ║\x1b[0m');
        term.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[1;36mType your commands below:\x1b[0m');
        term.write('\n\x1b[1;33m$\x1b[0m ');

        let currentLine = '';
        const commandHistory: string[] = [];

        // Handle user input
        term.onData((data) => {
            const code = data.charCodeAt(0);

            if (code === 13) {
                // Enter key
                term.write('\r\n');
                if (currentLine.trim()) {
                    commandHistory.push(currentLine);
                    executeCommand(term, currentLine.trim());
                }
                currentLine = '';
                term.write('\x1b[1;33m$\x1b[0m ');
            } else if (code === 127) {
                // Backspace
                if (currentLine.length > 0) {
                    currentLine = currentLine.slice(0, -1);
                    term.write('\b \b');
                }
            } else if (code === 27) {
                // Handle arrow keys (escape sequences)
                // This is a simplified version
            } else if (code >= 32 && code <= 126) {
                // Printable characters
                currentLine += data;
                term.write(data);
            }
        });

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    const handleRun = () => {
        if (xtermRef.current) {
            setIsRunning(true);
            xtermRef.current.writeln('\n\x1b[1;32m[Running...]\x1b[0m');
            setTimeout(() => {
                setIsRunning(false);
                xtermRef.current?.writeln('\x1b[1;32m[Completed]\x1b[0m');
                xtermRef.current?.write('\x1b[1;33m$\x1b[0m ');
            }, 1000);
        }
    };

    const handleStop = () => {
        if (xtermRef.current) {
            setIsRunning(false);
            xtermRef.current.writeln('\n\x1b[1;31m[Stopped]\x1b[0m');
            xtermRef.current.write('\x1b[1;33m$\x1b[0m ');
        }
    };

    const handleClear = () => {
        if (xtermRef.current) {
            xtermRef.current.clear();
            xtermRef.current.write('\x1b[1;33m$\x1b[0m ');
        }
    };

    const handleReset = () => {
        if (xtermRef.current) {
            xtermRef.current.reset();
            xtermRef.current.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════╗\x1b[0m');
            xtermRef.current.writeln('\x1b[1;32m║     Welcome to Code Craft Terminal v1.0          ║\x1b[0m');
            xtermRef.current.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════╝\x1b[0m');
            xtermRef.current.writeln('');
            xtermRef.current.write('\x1b[1;33m$\x1b[0m ');
        }
    };

    const handleCopy = async () => {
        if (xtermRef.current) {
            const selection = xtermRef.current.getSelection();
            if (selection) {
                await navigator.clipboard.writeText(selection);
            }
        }
    };

    return (
        <div className="flex h-full flex-col bg-[#0a0a0a]">
            {/* Terminal Controls */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-zinc-400">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                        <Play className="h-3.5 w-3.5" />
                        Run
                    </button>
                    <button
                        onClick={handleStop}
                        disabled={!isRunning}
                        className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                        <Square className="h-3.5 w-3.5" />
                        Stop
                    </button>
                    <div className="mx-2 h-5 w-px bg-zinc-700"></div>
                    <Tooltip content="Copy selection" position="top">
                        <button
                            onClick={handleCopy}
                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Clear terminal" position="top">
                        <button
                            onClick={handleClear}
                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Reset terminal" position="top">
                        <button
                            onClick={handleReset}
                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Terminal Content */}
            <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
        </div>
    );
}

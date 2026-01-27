'use client';

import { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    theme?: 'vs-dark' | 'light';
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };

    }, []);

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;

        // Initial layout trigger
        setTimeout(() => {
            editor.layout();
            editor.focus();
        }, 100);
    };

    const handleEditorChange = (value: string | undefined) => {
        onChange(value || '');
    };

    const handleBeforeMount = (monaco: Monaco) => {
        monaco.editor.defineTheme('noir', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.lineHighlightBackground': '#2a2d2e',
                'editorGutter.background': '#111111',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#ffffff',
                'scrollbarSlider.background': '#ffffff08',
                'scrollbarSlider.hoverBackground': '#ffffff15',
                'scrollbarSlider.activeBackground': '#ffffff20',
            }
        });
    };

    return (
        <div ref={containerRef} className="h-full w-full overflow-hidden bg-black">
            <Editor
                height="100%"
                language={language}
                value={value}
                theme="noir"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                beforeMount={handleBeforeMount}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: false,
                    tabSize: 2,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    quickSuggestions: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', 'Fira Code', monospace",
                }}
            />
        </div>
    );
}



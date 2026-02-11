'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Download,
  Upload,
  Save,
  PanelRightClose,
  ChevronDown,
  Code2,
  Sun,
  Moon,
  X,
  Sparkles,
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import dynamic from 'next/dynamic';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import SnippetsPanel from '@/components/SnippetsPanel';
import OutputPanel from '@/components/OutputPanel';
import Image from 'next/image';

import { useChat } from '@/components/providers/ChatProvider';

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', hasRuntime: true },
  { id: 'typescript', name: 'TypeScript', hasRuntime: false },
  { id: 'python', name: 'Python', hasRuntime: false },
  { id: 'java', name: 'Java', hasRuntime: false },
  { id: 'cpp', name: 'C++', hasRuntime: false },
  { id: 'go', name: 'Go', hasRuntime: false },
  { id: 'rust', name: 'Rust', hasRuntime: false },
  { id: 'csharp', name: 'C#', hasRuntime: false },
  { id: 'php', name: 'PHP', hasRuntime: false },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

console.log(binarySearch([1,2,3,4,5], 4)); // 3
`,
  python: `# Python Example
print("Welcome to Tounge!")
numbers = [1, 2, 3, 4, 5]
print("Squared:", [n ** 2 for n in numbers])
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to Java Compiler!");
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ Compiler!" << endl;
    return 0;
}
`,
  go: `package main
import "fmt"
func main() {
	fmt.Println("Welcome to Go Compiler!")
}
`,
  rust: `fn main() {
    println!("Welcome to Rust Compiler!");
}
`,
  csharp: `using System;
class Program {
    static void Main() {
        Console.WriteLine("Welcome to C# Compiler!");
    }
}
`,
  php: `<?php
echo "Welcome to PHP Compiler!\n";
?>
`,
};



export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'noir'>('vs-dark');
  const [showSnippets, setShowSnippets] = useState(false);
  const [terminalPosition, setTerminalPosition] = useState<'right' | 'bottom'>('right');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snippetsRefresh, setSnippetsRefresh] = useState(0);

  const [complexity, setComplexity] = useState<{ time: string; space: string } | null>(null);

  const [newSnippet, setNewSnippet] = useState({
    title: '',
    description: '',
    tags: '',
  });

  const { isOpen: isChatOpen, toggleChat, setEditorCode } = useChat();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Sync code to Chat Context
  useEffect(() => {
    setEditorCode(code);
  }, [code, setEditorCode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = LANGUAGES.find(l => l.id === language);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || `// ${newLanguage} code\n\n`);
    setOutput('');
    setError(null);
    setExecutionTime(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError(null);
    setExecutionTime(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output);
        setError(data.error);
        setExecutionTime(data.executionTime);
        if (data.metadata?.complexity) {
          setComplexity(data.metadata.complexity);
        }
      } else {
        setError(data.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

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
          language: language,
          code: code,
          tags: newSnippet.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSaveDialog(false);
        setNewSnippet({ title: '', description: '', tags: '' });
        setSnippetsRefresh(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving snippet:', error);
    }
  };

  const handleLoadSnippet = (snippetCode: string, snippetLanguage: string) => {
    setCode(snippetCode);
    setLanguage(snippetLanguage);
    setOutput('');
    setError(null);
    setExecutionTime(null);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
      php: 'php',
    };
    a.download = `code.${extensions[language] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.ts,.py,.java,.cpp,.go,.rs,.cs,.php,.txt';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target?.result) {
            setCode(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save Dialog Shortcuts
    if (showSaveDialog) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveSnippet();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSaveDialog(false);
        return;
      }
      // Prevent other shortcuts while dialog is open
      return;
    }

    // Global Shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
    if (e.key === 'F8') {
      e.preventDefault();
      handleRunCode();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setShowSaveDialog(true);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault();
      setTerminalPosition(terminalPosition === 'right' ? 'bottom' : 'right');
    }
    if (e.key === 'Escape') {
      setShowSnippets(prev => !prev);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white font-sans selection:bg-white/20" onKeyDown={handleKeyDown}>
      {/* Vercel Noir Header - Refined 2026 */}
      <header className="flex h-14 items-center justify-between border-b border-[#222] bg-black px-5 shrink-0 relative z-30">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-white uppercase tracking-tighter">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shrink-0 border-white/10 p-1.5 font-bold">
              <img src="/icon.png" alt="Tounge Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-black hidden sm:block">Tounge</span>
          </div>

          <div className="h-6 w-px bg-[#222] hidden sm:block" />

          <div ref={languageMenuRef} className="relative z-50">
            <div
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg transition-all border ${isLanguageMenuOpen ? 'bg-[#111] border-[#222] text-white' : 'border-transparent hover:bg-[#111] text-white/70 hover:text-white'}`}
            >
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block select-none">{currentLanguage?.name}</span>
              <ChevronDown
                size={16}
                strokeWidth={3}
                className={`transition-transform duration-300 ${isLanguageMenuOpen ? 'rotate-180 text-white' : 'text-white/50 group-hover:text-white'}`}
              />
            </div>

            <AnimatePresence>
              {isLanguageMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, listStyle: 'none' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-[#050505] border border-[#222] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 overflow-hidden flex flex-col"
                >
                  <span className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#444] select-none">Select Runtime</span>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        handleLanguageChange(lang.id);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-all flex items-center justify-between group ${language === lang.id ? 'text-white bg-[#111]' : 'text-white/50 hover:text-white'}`}
                    >
                      {lang.name}
                      {language === lang.id && (
                        <motion.div layoutId="activeLang" className="h-1.5 w-1.5 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              style={{ backgroundColor: '#ffffff', color: '#000000', minWidth: '100px' }}
              className="flex items-center justify-center gap-2 h-8 px-4 rounded-full font-black text-[10px] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-widest whitespace-nowrap z-50"
            >
              {isRunning ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Play size={14} fill="#000000" strokeWidth={3} color="#000000" />
              )}
              <span>{isRunning ? 'RUNNING' : 'EXECUTE'}</span>
            </button>

            <Tooltip content="Save" position="bottom">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="p-2.5 rounded-full hover:bg-[#111] text-white/50 hover:text-white transition-all active:scale-95"
              >
                <Save size={20} strokeWidth={3} />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-[#222] hidden sm:block" />

          <div className="flex items-center gap-3">
            <Tooltip content="Upload" position="bottom">
              <button
                onClick={handleUpload}
                className="p-2.5 rounded-full hover:bg-[#111] text-white/40 hover:text-white transition-all"
              >
                <Upload size={20} strokeWidth={3} />
              </button>
            </Tooltip>
            <Tooltip content="Download" position="bottom">
              <button
                onClick={handleDownload}
                className="p-2.5 rounded-full hover:bg-[#111] text-white/40 hover:text-white transition-all"
              >
                <Download size={20} strokeWidth={3} />
              </button>
            </Tooltip>
            <Tooltip content="Theme" position="bottom">
              <button
                onClick={() => setTheme(theme === 'vs-dark' ? 'noir' : 'vs-dark')}
                className="p-2.5 rounded-full hover:bg-[#111] text-white/40 hover:text-white transition-all"
              >
                {theme === 'vs-dark' ? <Sun size={20} strokeWidth={3} /> : <Moon size={20} strokeWidth={3} />}
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        <motion.div
          initial={{ width: 64 }}
          animate={{ width: showSnippets ? 340 : 64 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full border-r border-[#222] bg-black flex flex-col shrink-0 relative z-50"
        >
          {/* Toggle Header */}
          <div className={`h-16 flex items-center shrink-0 border-b border-[#222] ${showSnippets ? 'justify-end px-4' : 'justify-center'}`}>
            <Tooltip content={showSnippets ? "Collapse" : "Expand"} position="right">
              <button
                onClick={() => setShowSnippets(!showSnippets)}
                className={`p-3 rounded-xl transition-all active:scale-90 border border-transparent hover:bg-[#111] ${showSnippets ? 'text-white' : 'text-white/40'}`}
              >
                <PanelRightClose size={20} className={`transition-transform duration-300 ${!showSnippets ? 'rotate-180' : ''}`} />
              </button>
            </Tooltip>
          </div>

          {/* Sidebar Content */}
          <div className={`flex-1 w-[340px] overflow-hidden transition-opacity duration-300 ${showSnippets ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <SnippetsPanel
              onLoadSnippet={handleLoadSnippet}
              isExpanded={showSnippets}
              refreshTrigger={snippetsRefresh}
            />
          </div>
        </motion.div>

        <PanelGroup orientation={terminalPosition === 'right' ? 'horizontal' : 'vertical'} className="flex-1">
          <Panel defaultSize={70} minSize={20} className="relative">
            <div className="absolute bottom-6 right-6 z-10 opacity-30 pointer-events-none">
              <span className="text-sm font-mono uppercase tracking-[0.2em] font-bold">{language}</span>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              theme={theme}
            />
          </Panel>

          <PanelResizeHandle className={`relative group transition-colors hover:bg-white/10 ${terminalPosition === 'right' ? 'w-px' : 'h-px'}`}>
            <div className={`absolute bg-[#222] transition-colors group-hover:bg-white/40 ${terminalPosition === 'right' ? 'inset-y-0 w-px' : 'inset-x-0 h-px'}`} />
          </PanelResizeHandle>

          <Panel defaultSize={30} minSize={10}>
            <OutputPanel
              output={output}
              error={error}
              isRunning={isRunning}
              executionTime={executionTime}
              complexity={complexity}
              terminalPosition={terminalPosition}
              onTogglePosition={() => setTerminalPosition(terminalPosition === 'right' ? 'bottom' : 'right')}
              onClear={() => {
                setOutput('');
                setError(null);
                setExecutionTime(null);
                setComplexity(null);
              }}
              codeContext={code}
              language={language}
            />
          </Panel>
        </PanelGroup>
      </main>

      {/* Save Dialog Backdrop */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveDialog(false)}
            className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-xs p-24"
          >
            <motion.div
              initial={{ scale: 0.99, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.99, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[760px] rounded-[48px] border border-white/5 bg-[#0a0a0a] p-32 shadow-[0_64px_256px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="space-y-32">
                <div className="space-y-6">
                  <h3 className="text-[12px] font-black uppercase tracking-[1em] text-white/10">Archive Protocol</h3>
                  <h2 className="text-6xl font-black tracking-tighter text-white">Commit Logic</h2>
                </div>

                <div className="space-y-24">
                  <div className="space-y-8">
                    <label className="text-[12px] font-bold text-[#444] uppercase tracking-[0.5em] px-2 flex items-center gap-6">
                      Logic Identifier
                      <div className="h-px flex-1 bg-white/5" />
                    </label>
                    <input
                      type="text"
                      value={newSnippet.title}
                      onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                      className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl py-8 px-10 text-2xl font-bold text-white outline-none focus:border-[#00a3ff]/40 focus:ring-12 focus:ring-[#00a3ff]/5 transition-all placeholder-[#222]"
                      placeholder="Enter script name..."
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-10 p-12 rounded-[40px] border border-white/5 bg-white/2 mx-1 shadow-inner">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-black border border-white/10 shadow-2xl">
                      <Code2 size={40} className="text-white/20" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[13px] font-bold text-white/20 uppercase tracking-[0.6em] leading-none">Platform Runtime</span>
                      <span className="text-3xl font-black text-white uppercase tracking-tight">{currentLanguage?.name} Core</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 pt-24">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 flex items-center justify-center gap-4 py-8 rounded-2xl border border-white/5 bg-white/2 text-white/40 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white/5 hover:text-white transition-all active:scale-95"
                    >
                      <X size={24} strokeWidth={3} />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveSnippet}
                      className="flex-2 flex items-center justify-center gap-5 py-8 bg-white text-[#00a3ff] text-sm font-black uppercase tracking-[0.5em] rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 shadow-[0_30px_100px_rgba(0,163,255,0.2)]"
                    >
                      <Save size={24} strokeWidth={3} />
                      <span>Archive Logic</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Footer */}
      <footer className="h-12 flex items-center justify-between border-t border-[#222] bg-black px-6 text-xs shrink-0">
        <div className="flex items-center gap-8 text-white font-bold">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'}`} />
            <span className="uppercase tracking-widest">Engine Online</span>
          </div>
          <span className="text-[#333]">|</span>
          <span className="uppercase tracking-widest text-[#888]">{currentLanguage?.name}</span>
          <span className="text-[#333]">|</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] -2">AI : Ctrl + Q</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px]">Chat Min/Max : Ctrl + F</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] flex items-center justify-center gap-2"><PanelRightClose size={18} /> : ESC</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px]">Save: Ctrl + S</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px]">Layout: Ctrl + `</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px]">Run: Ctrl + F8</span>
        </div>

        <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest">


          <button
            onClick={toggleChat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isChatOpen ? 'bg-[#06B6D4] text-[#06B6D4] shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'hover:bg-white/5 text-[#888] hover:text-[#FFD700]'}`}
          >
            <Sparkles size={24} strokeWidth={2} className={isChatOpen ? "fill-[#06B6D4]" : ""} />
            <span className="text-[11px] uppercase tracking-widest font-bold pt-2 mt-4 "
              style={{ marginRight: "10px" }}>Ask TOUNGE</span>
          </button>

          {/* <span className="px-3 py-1 rounded bg-[#111] border border-[#222] text-white">TOUNGE</span> */}
        </div>
      </footer>
    </div>
  );
}

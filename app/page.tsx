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
  Code,
  Terminal as TerminalIcon,
  BookOpen,
  MoreVertical,
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
\tfmt.Println("Welcome to Go Compiler!")
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

  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    description: '',
    tags: '',
  });

  // Mobile overlay state — editor is always the base
  const [mobileOverlay, setMobileOverlay] = useState<'none' | 'output' | 'library'>('none');
  const [isMobile, setIsMobile] = useState(false);

  const toggleMobileOverlay = (panel: 'output' | 'library') => {
    setMobileOverlay(prev => prev === panel ? 'none' : panel);
  };

  const { isOpen: isChatOpen, toggleChat, setEditorCode } = useChat();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Detect mobile and force terminal to bottom
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setTerminalPosition('bottom');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync code to Chat Context
  useEffect(() => {
    setEditorCode(code);
  }, [code, setEditorCode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
    // Auto-open output overlay on mobile when running
    if (isMobile) setMobileOverlay('output');

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
      const url = editingSnippetId
        ? `/api/snippets/${editingSnippetId}`
        : '/api/snippets';

      const method = editingSnippetId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        setEditingSnippetId(null);
        setSnippetsRefresh(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving snippet:', error);
    }
  };

  const handleEditSnippet = (snippet: any) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setNewSnippet({
      title: snippet.title,
      description: snippet.description || '',
      tags: snippet.tags?.join(', ') || '',
    });
    setEditingSnippetId(snippet._id);
    setOutput('');
    setError(null);
    setExecutionTime(null);
    if (isMobile) setMobileOverlay('none');
  };

  const handleLoadSnippet = (snippetCode: string, snippetLanguage: string) => {
    setCode(snippetCode);
    setLanguage(snippetLanguage);
    setEditingSnippetId(null);
    setNewSnippet({ title: '', description: '', tags: '' });
    setOutput('');
    setError(null);
    setExecutionTime(null);
    if (isMobile) setMobileOverlay('none');
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
        setEditingSnippetId(null);
        setNewSnippet({ title: '', description: '', tags: '' });
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
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-[#222] bg-black px-3 sm:px-5 shrink-0 relative z-30">
        <div className="flex items-center gap-3 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-4 text-white uppercase tracking-tighter">
            <button
              onClick={() => isMobile && toggleMobileOverlay('library')}
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl overflow-hidden shrink-0 border-white/10 p-1.5 font-bold transition-all active:scale-95 ${isMobile && mobileOverlay === 'library' ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
            >
              <img src="/icon.png" alt="Tounge Logo" className="h-full w-full object-contain" />
            </button>
            <span className="text-lg sm:text-xl font-black hidden sm:block">Tounge</span>
          </div>

          <div className="h-6 w-px bg-[#222] hidden sm:block" />

          <div ref={languageMenuRef} className="relative z-50">
            <div
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer group px-2 sm:px-3 py-1.5 rounded-lg transition-all border ${isLanguageMenuOpen ? 'bg-[#111] border-[#222] text-white' : 'border-transparent hover:bg-[#111] text-white/70 hover:text-white'}`}
            >
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block select-none">{currentLanguage?.name}</span>
              {/* Show short name on mobile */}
              <span className="text-[10px] font-bold uppercase tracking-wider sm:hidden select-none">{currentLanguage?.name?.slice(0, 2)}</span>
              <ChevronDown
                size={14}
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
                  className="absolute top-full left-0 mt-2 w-48 sm:w-56 bg-[#050505] border border-[#222] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 overflow-hidden flex flex-col"
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

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Run Button */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="hidden sm:flex items-center justify-center gap-1.5 sm:gap-2 h-8 px-3 sm:px-4 rounded-full font-black text-[10px] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-widest whitespace-nowrap z-50 min-w-[60px]"
            >
              {isRunning ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Play size={12} fill="#000000" strokeWidth={3} color="#000000" />
              )}
              <span className="hidden sm:inline">{isRunning ? 'RUNNING' : 'EXECUTE'}</span>
            </button>

            {/* Mobile Nav Actions */}
            <div className="flex sm:hidden items-center gap-3">
              {/* Play Line Icon for Run */}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`p-2 rounded-lg transition-all active:scale-90 ${isRunning ? 'text-white/20' : 'text-white hover:bg-white/10'}`}
              >
                {isRunning ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Play size={20} strokeWidth={2.5} />
                )}
              </button>

              {/* Output Tab Icon */}
              <button
                onClick={() => toggleMobileOverlay('output')}
                className={`p-2 rounded-lg transition-all active:scale-90 relative ${mobileOverlay === 'output' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
              >
                <TerminalIcon size={20} strokeWidth={2.5} />
                {(output || error) && mobileOverlay !== 'output' && (
                  <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#00a3ff]" />
                )}
              </button>

              {/* More Vertical (Three Dots) */}
              <div ref={mobileMenuRef} className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded-lg transition-all active:scale-90 ${isMobileMenuOpen ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
                >
                  <MoreVertical size={20} strokeWidth={2.5} />
                </button>

                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.98 }}
                      className="absolute top-full right-0 mt-4  h-28 flex flex-col  justify-between bg-[#0A0A0A] border border-white/10 rounded-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] py-2.5 overflow-hidden z-50 backdrop-blur-xl"
                    >
                      <button
                        onClick={() => {
                          setShowSaveDialog(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-4 px-6 py-4.5 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Save size={18} strokeWidth={2.5} />
                        Save Logic
                      </button>

                      <div className="mx-4 h-px bg-white/5" />

                      <button
                        onClick={() => {
                          setTheme(theme === 'vs-dark' ? 'noir' : 'vs-dark');
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-4 px-6 py-4.5 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {theme === 'vs-dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                        Appearance
                      </button>

                      <div className="mx-4 h-px bg-white/5" />

                      <button
                        onClick={() => {
                          toggleChat();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 px-6 py-4.5 text-xs font-bold uppercase tracking-widest transition-all ${isChatOpen ? 'text-[#06B6D4] bg-[#06B6D4]/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                      >
                        <Sparkles size={18} strokeWidth={2.5} className={isChatOpen ? 'fill-[#06B6D4]' : ''} />
                        Ask AI
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Tooltip content="Save" position="bottom">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="hidden sm:block p-2 sm:p-2.5 rounded-full hover:bg-[#111] text-white/50 hover:text-white transition-all active:scale-95"
              >
                <Save size={18} strokeWidth={3} />
              </button>
            </Tooltip>
          </div>

          {/* Secondary actions — hidden on mobile */}
          <div className="w-px h-5 bg-[#222] hidden md:block" />

          <div className="hidden md:flex items-center gap-3">
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

      {/* ===== DESKTOP LAYOUT (md+) ===== */}
      <main className="hidden md:flex flex-1 overflow-hidden">
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
              onEditSnippet={handleEditSnippet}
              activeSnippetId={editingSnippetId}
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

      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <main className="flex md:hidden flex-1 overflow-hidden flex-col relative">
        {/* Editor is always the persistent base */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0">
            <div className="relative h-full">
              <div className="absolute bottom-4 right-4 z-10 opacity-20 pointer-events-none">
                <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">{language}</span>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                theme={theme}
              />
            </div>
          </div>

          {/* Output Overlay — slides up from the bottom */}
          <AnimatePresence>
            {mobileOverlay === 'output' && (
              <motion.div
                key="output-overlay"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute inset-0 z-20 bg-black"
              >
                <OutputPanel
                  output={output}
                  error={error}
                  isRunning={isRunning}
                  executionTime={executionTime}
                  complexity={complexity}
                  terminalPosition="bottom"
                  onTogglePosition={() => { }}
                  onClear={() => {
                    setOutput('');
                    setError(null);
                    setExecutionTime(null);
                    setComplexity(null);
                  }}
                  codeContext={code}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Library Overlay — slides in from the bottom */}
          <AnimatePresence>
            {mobileOverlay === 'library' && (
              <motion.div
                key="library-overlay"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute inset-0 z-20 bg-black"
              >
                <SnippetsPanel
                  onLoadSnippet={handleLoadSnippet}
                  onEditSnippet={handleEditSnippet}
                  activeSnippetId={editingSnippetId}
                  isExpanded={true}
                  refreshTrigger={snippetsRefresh}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </main>

      {/* Save Dialog Backdrop */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSaveDialog(false);
              setEditingSnippetId(null);
              setNewSnippet({ title: '', description: '', tags: '' });
            }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs p-4 sm:p-12 md:p-24"
          >
            <motion.div
              initial={{ scale: 0.99, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.99, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[760px] rounded-[24px] sm:rounded-[36px] md:rounded-[48px] border border-white/5 bg-[#0a0a0a] p-6 sm:p-14 md:p-20 shadow-[0_64px_256px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="space-y-8 sm:space-y-16 md:space-y-20">
                {/* Title */}
                <div className="space-y-2 sm:space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] sm:tracking-[1em] text-white/10">
                    {editingSnippetId ? 'Update Protocol' : 'Archive Protocol'}
                  </h3>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                    {editingSnippetId ? 'Update Logic' : 'Commit Logic'}
                  </h2>
                </div>

                {/* Fields */}
                <div className="space-y-4 sm:space-y-8">
                  {/* Title Input */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[11px] font-bold text-[#444] uppercase tracking-[0.3em] sm:tracking-[0.5em] px-1 flex items-center gap-4">
                      Logic Identifier
                      <div className="h-px flex-1 bg-white/5" />
                    </label>
                    <input
                      type="text"
                      value={newSnippet.title}
                      onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                      className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl sm:rounded-2xl py-3 sm:py-5 md:py-8 px-4 sm:px-8 text-base sm:text-xl md:text-2xl font-bold text-white outline-none focus:border-[#00a3ff]/40 transition-all placeholder-[#333]"
                      placeholder="Enter script name..."
                      autoFocus
                    />
                  </div>

                  {/* Language Badge */}
                  <div className="flex items-center gap-4 sm:gap-8 p-4 sm:p-8 rounded-2xl sm:rounded-[28px] border border-white/5 bg-white/2">
                    <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-black border border-white/10">
                      <Code2 size={24} className="text-white/20" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em] leading-none">Platform Runtime</span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{currentLanguage?.name} Core</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 sm:gap-6 pt-4 sm:pt-8">
                    <button
                      onClick={() => {
                        setShowSaveDialog(false);
                        setEditingSnippetId(null);
                        setNewSnippet({ title: '', description: '', tags: '' });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-6 rounded-xl sm:rounded-2xl border border-white/5 bg-white/2 text-white/40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] hover:bg-white/5 hover:text-white transition-all active:scale-95"
                    >
                      <X size={16} strokeWidth={3} />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveSnippet}
                      className="flex-2 flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-6 bg-white text-[#00a3ff] text-[10px] sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] rounded-xl sm:rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 shadow-[0_20px_60px_rgba(0,163,255,0.2)]"
                    >
                      <Save size={16} strokeWidth={3} />
                      <span>{editingSnippetId ? 'Update Logic' : 'Archive Logic'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer — Desktop only */}
      <footer className="hidden md:flex h-12 items-center justify-between border-t border-[#222] bg-black px-6 text-xs shrink-0">
        <div className="flex items-center gap-4 lg:gap-8 text-white font-bold">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'}`} />
            <span className="uppercase tracking-widest">Engine Online</span>
          </div>
          <span className="text-[#333]">|</span>
          <span className="uppercase tracking-widest text-[#888]">{currentLanguage?.name}</span>
          <span className="text-[#333] hidden lg:block">|</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden lg:block">AI : Ctrl + Q</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden lg:block">Chat Min/Max : Ctrl + F</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden lg:flex items-center justify-center gap-2"><PanelRightClose size={18} /> : ESC</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden lg:block">Save: Ctrl + S</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden xl:block">Layout: Ctrl + `</span>
          <span className="uppercase tracking-widest text-[#666] text-[10px] hidden xl:block">Run: Ctrl + F8</span>
        </div>

        <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest">
          <button
            onClick={toggleChat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isChatOpen ? 'bg-[#06B6D4] text-[#06B6D4] shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'hover:bg-white/5 text-[#888] hover:text-[#FFD700]'}`}
          >
            <Sparkles size={24} strokeWidth={2} className={isChatOpen ? "fill-[#06B6D4]" : ""} />
            <span className="text-[11px] uppercase tracking-widest font-bold pt-2 mt-4"
              style={{ marginRight: "10px" }}>Ask TOUNGE</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Download,
  Upload,
  Save,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Code2,
  Sun,
  Moon,
  Layout,
  Columns,
  Rows
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import SnippetsPanel from '@/components/SnippetsPanel';
import OutputPanel from '@/components/OutputPanel';

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
  javascript: `// Welcome to Code Craft Compiler!
// Write your JavaScript code here and click Run or press Ctrl+Enter

// Example: Simple function
function greet(name) {
  return \`Hello, \${name}! Welcome to the JavaScript playground.\`;
}

console.log(greet("Developer"));

// Try some array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// Object example
const user = {
  name: "John",
  age: 25,
  skills: ["JavaScript", "TypeScript", "React"]
};

console.log("User info:", user);
`,
  typescript: `// TypeScript Example
interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return {
    id: Date.now(),
    name,
    email
  };
}

const user = createUser("Alice", "alice@example.com");
console.log("Created user:", user);
`,
  python: `# Python Example
print("Welcome to Python Compiler!")

# List comprehension
numbers = [1, 2, 3, 4, 5]
squared = [n ** 2 for n in numbers]
print("Squared:", squared)

# Function
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to Java Compiler!");
        
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum: " + sum);
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Welcome to C++ Compiler!" << endl;
    
    vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int num : numbers) {
        sum += num;
    }
    cout << "Sum: " << sum << endl;
    
    return 0;
}
`,
  go: `package main

import "fmt"

func main() {
\tfmt.Println("Welcome to Go Compiler!")
\t
\tnumbers := []int{1, 2, 3, 4, 5}
\tsum := 0
\tfor _, num := range numbers {
\t\tsum += num
\t}
\tfmt.Printf("Sum: %d\\n", sum)
}
`,
  rust: `fn main() {
    println!("Welcome to Rust Compiler!");
    
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
`,
  csharp: `using System;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("Welcome to C# Compiler!");
        
        int[] numbers = { 1, 2, 3, 4, 5 };
        int sum = numbers.Sum();
        Console.WriteLine($"Sum: {sum}");
    }
}
`,
  php: `<?php
echo "Welcome to PHP Compiler!\\n";

$numbers = [1, 2, 3, 4, 5];
$sum = array_sum($numbers);
echo "Sum: $sum\\n";
?>
`,
};

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [showSnippets, setShowSnippets] = useState(false);
  const [terminalPosition, setTerminalPosition] = useState<'right' | 'bottom'>('right');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

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
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute code');
    } finally {
      setIsRunning(false);
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
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          setCode(event.target.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Keyboard shortcut for Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100" onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4 min-h-[72px]">
        {/* Left: Title & Logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Code Craft</h1>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-none mt-1">Compiler Engine</p>
          </div>
        </div>

        {/* Center: Language & Run Button */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-hover:text-blue-400 transition-colors">
              <ChevronDown size={14} className="mt-0.5" />
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg block w-48 pl-10 pr-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800/80 cursor-pointer font-medium outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-zinc-800 mx-1" />

          {/* Run Button - Modernized */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center justify-center rounded-full bg-green-600 w-11 h-11 text-white transition-all hover:bg-green-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30 group"
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Play className="h-5 w-5 fill-current group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            )}
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-800/50 p-1 rounded-xl border border-zinc-800/50">
          <button
            onClick={handleUpload}
            className="rounded-lg p-2.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            title="Upload file"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={handleDownload}
            className="rounded-lg p-2.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            title="Download code"
          >
            <Download size={18} />
          </button>

          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="rounded-lg p-2.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            title="Toggle theme"
          >
            {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="rounded-lg p-2.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content - Resizable Layout */}
      <div className="flex flex-1 overflow-hidden border-t border-zinc-800">
        {/* Integrated Side Panel (Expandable) */}
        <motion.div
          initial={false}
          animate={{
            width: showSnippets ? 320 : 48
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="shrink-0 h-full border-r border-zinc-800 bg-zinc-950 overflow-hidden"
        >
          <SnippetsPanel
            onLoadSnippet={handleLoadSnippet}
            currentCode={code}
            currentLanguage={language}
            isExpanded={showSnippets}
            onToggle={() => setShowSnippets(!showSnippets)}
          />
        </motion.div>

        <PanelGroup orientation={terminalPosition === 'right' ? 'horizontal' : 'vertical'} className="flex-1 h-full">
          {/* Editor Panel */}
          <Panel defaultSize={70} minSize={20} className="flex flex-col">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              theme={theme}
            />
          </Panel>

          <PanelResizeHandle className={`relative group hover:bg-blue-600/50 transition-colors ${terminalPosition === 'right' ? 'w-1 px-0.5 cursor-col-resize' : 'h-1 py-0.5 cursor-row-resize'}`}>
            <div className={`absolute bg-zinc-800 group-hover:bg-blue-400/50 ${terminalPosition === 'right' ? 'inset-y-0 left-1/2 -translate-x-1/2 w-px' : 'inset-x-0 top-1/2 -translate-y-1/2 h-px'}`} />
          </PanelResizeHandle>

          {/* Output Panel */}
          <Panel defaultSize={30} minSize={10} className="flex flex-col">
            <OutputPanel
              output={output}
              error={error}
              isRunning={isRunning}
              executionTime={executionTime}
              terminalPosition={terminalPosition}
              onTogglePosition={() => setTerminalPosition(terminalPosition === 'right' ? 'bottom' : 'right')}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {currentLanguage?.name}
          </span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500">
          <span>Press Ctrl+Enter to run code</span>
          {executionTime !== null && (
            <span className="text-green-400">⚡ {executionTime}ms</span>
          )}
        </div>
      </footer>
    </div>
  );
}

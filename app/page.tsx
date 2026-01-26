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
  ChevronRight
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
  const [runtime, setRuntime] = useState<'node' | 'browser'>('node');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [showSnippets, setShowSnippets] = useState(false);
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
          language,
          runtime: language === 'javascript' ? runtime : undefined,
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
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-100 ml-2">Code Craft Compiler</h1>
        </div>

        {/* Center: Language, Runtime, Run Button */}
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Runtime Tabs for JavaScript */}
          {currentLanguage?.hasRuntime && (
            <div className="flex rounded-md border border-zinc-700 bg-zinc-800">
              <button
                onClick={() => setRuntime('node')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${runtime === 'node'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setRuntime('browser')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${runtime === 'browser'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                Browser
              </button>
            </div>
          )}

          {/* Run Button - Icon only as requested */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center justify-center rounded-md bg-green-600 p-2 text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpload}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Upload file"
          >
            <Upload className="h-4 w-4" />
          </button>

          <button
            onClick={handleDownload}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Download code"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Toggle theme"
          >
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          <button
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
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

        <PanelGroup orientation="horizontal" className="flex-1 h-full">
          {/* Editor Panel */}
          <Panel defaultSize={50} minSize={20} className="flex flex-col">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              theme={theme}
            />
          </Panel>

          <PanelResizeHandle className="relative w-1 px-0.5 group hover:bg-blue-600/50 transition-colors cursor-col-resize">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-zinc-800 group-hover:bg-blue-400/50" />
          </PanelResizeHandle>

          {/* Output Panel */}
          <Panel defaultSize={50} minSize={20} className="flex flex-col">
            <OutputPanel
              output={output}
              error={error}
              isRunning={isRunning}
              executionTime={executionTime}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {currentLanguage?.name} {currentLanguage?.hasRuntime && `- ${runtime === 'node' ? 'Node.js' : 'Browser'} Runtime`}
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

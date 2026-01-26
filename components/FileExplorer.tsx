'use client';

import { useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, FileCode, FileJson, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
}

interface FileExplorerProps {
    onFileSelect: (path: string, name: string) => void;
    selectedFile: string | null;
}

const sampleFileStructure: FileNode[] = [
    {
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
            { name: 'index.ts', type: 'file', path: '/src/index.ts' },
            { name: 'app.ts', type: 'file', path: '/src/app.ts' },
            {
                name: 'components',
                type: 'folder',
                path: '/src/components',
                children: [
                    { name: 'Button.tsx', type: 'file', path: '/src/components/Button.tsx' },
                    { name: 'Card.tsx', type: 'file', path: '/src/components/Card.tsx' },
                ],
            },
            {
                name: 'utils',
                type: 'folder',
                path: '/src/utils',
                children: [
                    { name: 'helpers.ts', type: 'file', path: '/src/utils/helpers.ts' },
                ],
            },
        ],
    },
    {
        name: 'public',
        type: 'folder',
        path: '/public',
        children: [
            { name: 'index.html', type: 'file', path: '/public/index.html' },
            { name: 'styles.css', type: 'file', path: '/public/styles.css' },
        ],
    },
    { name: 'package.json', type: 'file', path: '/package.json' },
    { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json' },
    { name: 'README.md', type: 'file', path: '/README.md' },
];

function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
            return <FileCode className="h-4 w-4 text-blue-400" />;
        case 'json':
            return <FileJson className="h-4 w-4 text-yellow-400" />;
        case 'md':
        case 'txt':
            return <FileText className="h-4 w-4 text-gray-400" />;
        case 'html':
            return <FileCode className="h-4 w-4 text-orange-400" />;
        case 'css':
            return <FileCode className="h-4 w-4 text-pink-400" />;
        default:
            return <File className="h-4 w-4 text-gray-400" />;
    }
}

function FileTreeNode({
    node,
    level = 0,
    onFileSelect,
    selectedFile
}: {
    node: FileNode;
    level?: number;
    onFileSelect: (path: string, name: string) => void;
    selectedFile: string | null;
}) {
    const [isOpen, setIsOpen] = useState(level === 0);

    const handleClick = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node.path, node.name);
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800',
                    selectedFile === node.path && 'bg-zinc-800 text-blue-400'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {node.type === 'folder' && (
                    <>
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-zinc-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-500" />
                        )}
                        <Folder className="h-4 w-4 text-blue-400" />
                    </>
                )}
                {node.type === 'file' && (
                    <span className="ml-6">{getFileIcon(node.name)}</span>
                )}
                <span className="flex-1 truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isOpen && node.children && (
                <div>
                    {node.children.map((child, index) => (
                        <FileTreeNode
                            key={index}
                            node={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
    return (
        <div className="flex h-full flex-col bg-zinc-950 text-zinc-300">
            <div className="border-b border-zinc-800 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Explorer
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {sampleFileStructure.map((node, index) => (
                    <FileTreeNode
                        key={index}
                        node={node}
                        onFileSelect={onFileSelect}
                        selectedFile={selectedFile}
                    />
                ))}
            </div>
        </div>
    );
}

# Code Craft Compiler
-fix ai models
-fix ui bugs

A powerful, modern **code compiler** and execution engine for multiple programming languages, built with Next.js and TypeScript.

![Tounge](https://img.shields.io/badge/Tounge-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 🚀 Multi-Language Compiler
Compile and execute code in **9 modern programming languages**:
- **JavaScript** (with Node.js & Browser runtime support)
- **TypeScript**
- **Python**
- **Java**
- **C++**
- **Go**
- **Rust**
- **C#**
- **PHP**

### ⚡ JavaScript Dual Runtime
For JavaScript, choose between:
- **Node.js Runtime** - Full access to Node.js built-in modules (fs, path, http, etc.)
- **Browser Runtime** - Simulated browser environment with window and document objects

### 🎨 Professional Code Editor
- **Monaco Editor** - The same editor that powers VS Code
- **Syntax Highlighting** - Language-specific syntax coloring
- **IntelliSense** - Smart code completion and suggestions
- **Minimap** - Bird's eye view of your code
- **Auto-formatting** - Format on type and paste
- **Dark/Light Themes** - Choose your preferred theme

### 📊 Real-time Output Console
- **Execution Results** - See your code output instantly
- **Error Reporting** - Detailed compilation and runtime errors
- **Execution Time** - Performance metrics for each run
- **Color-coded Output** - Success (green), Error (red), Running (blue)

### 💾 Code Snippets Management
- **Save Snippets** - Store your code snippets in MongoDB
- **Search & Filter** - Find snippets by language or search term
- **Tags Support** - Organize with custom tags
- **Quick Load** - Load snippets into editor with one click
- **CRUD Operations** - Create, Read, Update, Delete snippets

### 🔧 Developer Tools
- **Upload Files** - Import code from your local files
- **Download Code** - Export your code with proper extensions
- **Status Bar** - Real-time statistics (lines, characters, execution time)
- **Responsive UI** - Beautiful interface with Tailwind CSS
- **Smooth Animations** - Powered by Framer Motion

## 🚀 Getting Started

### Prerequisites

Install the required compilers/interpreters for the languages you want to use:

- **Node.js 18+** (required for JavaScript/TypeScript execution)
- **Python 3.x** (for Python code)
- **Java JDK 11+** (for Java code)
- **GCC/G++** (for C++ code)
- **Go 1.20+** (for Go code)
- **Rust** (for Rust code)
- **Mono/.NET** (for C# code)
- **PHP 8.x** (for PHP code)
- **MongoDB** (for snippets storage)

### Installation

1. **Navigate to the project**
   ```bash
   cd code-craft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   The `.env.local` file has been created. For MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-craft
   ```

4. **Start MongoDB** (if using local MongoDB)
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Compiling Code

1. **Select Language** - Choose from the language dropdown (JavaScript, Python, Java, C++, etc.)
2. **Choose Runtime** (JavaScript only) - Select Node.js or Browser environment
3. **Write Code** - Use the Monaco editor to write your code
4. **Run Code** - Click the green "Run Code" button
5. **View Output** - See results in the output console below

### JavaScript Runtimes

#### Node.js Runtime
```javascript
// Access Node.js built-in modules
const fs = require('fs');
const path = require('path');

console.log('Running in Node.js');
console.log('Platform:', process.platform);
```

#### Browser Runtime
```javascript
// Access browser objects
console.log('Window object:', typeof window);
console.log('Document object:', typeof document);

// Note: Simulated environment on server
```

### Saving Code Snippets

1. Click "Save Current" in the snippets panel
2. Enter title, description, and tags
3. Click "Save Snippet"
4. Snippet is stored in MongoDB

### Loading Snippets

1. Search or filter snippets by language
2. Click "Load" on any snippet
3. Code loads into the editor
4. Select runtime (for JavaScript) and run

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Code Editor:** Monaco Editor
- **Database:** MongoDB with Mongoose
- **Code Execution:** Node.js child_process
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **File Processing:** UUID for unique file IDs

## 📁 Project Structure

```
code-craft/
├── app/
│   ├── api/
│   │   ├── execute/
│   │   │   └── route.ts          # Code execution API
│   │   └── snippets/
│   │       ├── route.ts          # Snippets CRUD
│   │       └── [id]/route.ts     # Individual snippet
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Compiler interface
├── components/
│   ├── CodeEditor.tsx            # Monaco editor
│   ├── OutputPanel.tsx           # Execution results
│   └── SnippetsPanel.tsx         # Snippets management
├── lib/
│   ├── mongodb.ts                # MongoDB connection
│   └── utils.ts                  # Utilities
├── models/
│   └── Snippet.ts                # Snippet model
├── temp/                         # Temporary files (auto-created)
└── package.json
```

## 🔌 API Endpoints

### Execute Code
```http
POST /api/execute
Body: {
  "code": "string",
  "language": "javascript" | "python" | "java" | ...,
  "runtime": "node" | "browser" (JavaScript only)
}

Response: {
  "success": true,
  "output": "string",
  "error": "string | null",
  "executionTime": number,
  "language": "string"
}
```

### Snippets API
Same as before (GET, POST, PUT, DELETE)

## 🌍 Supported Languages

| Language   | Version      | Extension | Compiler/Interpreter |
|-----------|--------------|-----------|---------------------|
| JavaScript | ES2024       | .js       | Node.js             |
| TypeScript | 5.x          | .ts       | tsx (ts-node)       |
| Python     | 3.x          | .py       | python3             |
| Java       | 11+          | .java     | javac + java        |
| C++        | C++17        | .cpp      | g++                 |
| Go         | 1.20+        | .go       | go                  |
| Rust       | Latest       | .rs       | rustc               |
| C#         | .NET         | .cs       | csc/mono            |
| PHP        | 8.x          | .php      | php                 |

## ⚙️ Configuration

### Security Settings
- Code execution timeout: 10 seconds
- Max output buffer: 1MB
- Temporary files auto-cleanup
- Sandboxed execution environment

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
```

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

**Note:** For production, you'll need to install language compilers on your server or use containerized solutions like Docker.

### Docker Support (Recommended for Production)
For production deployment with all language support, consider using Docker containers with pre-installed compilers.

## 🔒 Security Considerations

- Code execution happens in isolated processes
- 10-second timeout prevents infinite loops
- Temporary files are automatically cleaned up
- No file system access outside temp directory
- Consider sandboxing for production use

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a Pull Request.

## 📄 License

MIT License - Open source and free to use.

## 🙏 Acknowledgments

- Monaco Editor by Microsoft
- Next.js team
- Tailwind CSS
- MongoDB
- All language communities

---

**Made with ❤️ - A Modern Code Compiler for Developers**

🚀 **Compile. Execute. Create.**

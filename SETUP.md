# Code Craft Compiler - Setup Guide

## 🚀 Quick Start (Without MongoDB)

The compiler works perfectly without MongoDB! You can:
- ✅ **Compile and run code** in 9 languages
- ✅ **Use the Monaco editor** with all features
- ✅ **Switch between Node.js and Browser** runtimes for JavaScript
- ✅ **Upload/Download files**
- ✅ **All core compiler features**

## 💾 Optional: Enable Code Snippets (Requires MongoDB)

If you want to save code snippets, you need to start MongoDB:

### Windows:
```bash
# Start MongoDB service
net start MongoDB

# Or if installed via installer:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

### macOS:
```bash
# If installed via Homebrew:
brew services start mongodb-community

# Or run directly:
mongod --config /usr/local/etc/mongod.conf
```

### Linux:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or
sudo service mongod start
```

### Using MongoDB Atlas (Cloud - Recommended):
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-craft
   ```

## 🎯 What Works Without MongoDB

Everything except saving snippets:
- ✅ Code compilation
- ✅ JavaScript (Node.js + Browser)
- ✅ TypeScript
- ✅ Python  
- ✅ Java
- ✅ C++
- ✅ Go
- ✅ Rust
- ✅ C#
- ✅ PHP
- ✅ Monaco Editor
- ✅ File upload/download
- ✅ Themes
- ✅ Execution output

## 🔧 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 and start coding!

## 📝 Notes

- The hamburger menu (☰) shows saved snippets
- If MongoDB is not running, the snippets panel will be empty
- All compiler features work independently of MongoDB

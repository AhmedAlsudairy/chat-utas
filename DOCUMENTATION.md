# 🎓 Real-time RAG Chatbot - Complete System Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Technical Details](#technical-details)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

A production-ready AI-powered student helper that answers questions **exclusively** from uploaded PDF documents using:
- **React 19** with latest hooks
- **MCP (Model Context Protocol)** over WebSocket
- **RAG (Retrieval Augmented Generation)** with GPT-4o-mini
- **Real-time event triggers** for document updates

### Key Features

✅ **Strict Document-Only Responses** - AI only answers from provided PDFs  
✅ **Real-time Updates** - Auto-detects PDF additions/removals  
✅ **Streaming Responses** - Live answer generation  
✅ **Source Citations** - Shows exact document chunks used  
✅ **Event-Driven Architecture** - MCP protocol with WebSocket  
✅ **Modern React** - TypeScript, latest hooks, optimized rendering  

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            React 19 Frontend (TypeScript)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │  │
│  │  │ App.tsx  │  │  Hooks   │  │    Components        │ │  │
│  │  │          │  │          │  │  - ChatMessage       │ │  │
│  │  │  State   │──│ MCP      │  │  - ChatInput         │ │  │
│  │  │  Manager │  │ Socket   │  │  - DocumentList      │ │  │
│  │  │          │  │          │  │  - StatusBar         │ │  │
│  │  └──────────┘  └─────┬────┘  └──────────────────────┘ │  │
│  └────────────────────────┼───────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────┘
                          │ WebSocket (MCP Protocol)
                          │ ws://localhost:3001
┌─────────────────────────▼─────────────────────────────────┐
│                    MCP SERVER (Node.js)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              server.js (Express + WS)                │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   MCP      │  │   Document   │  │  Chokidar   │  │  │
│  │  │  Protocol  │  │  Processor   │  │  Watcher    │  │  │
│  │  │            │  │              │  │             │  │  │
│  │  │ Messages   │  │ PDF Parse    │  │ File Events │  │  │
│  │  │ Events     │  │ Chunking     │  │ Real-time   │  │  │
│  │  │ RPC        │  │ Search       │  │ Triggers    │  │  │
│  │  └────────────┘  └──────┬───────┘  └─────────────┘  │  │
│  └─────────────────────────┼──────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          │ RAG Pipeline
                          ▼
                ┌─────────────────────┐
                │   Document Store    │
                │   (Vector-like)     │
                │                     │
                │  - Chunks indexed   │
                │  - Keyword search   │
                │  - Relevance score  │
                └──────────┬──────────┘
                           │
                           │ Context
                           ▼
                ┌─────────────────────┐
                │    OpenAI GPT API   │
                │    (GPT-4o-mini)    │
                │                     │
                │  System: Use only   │
                │  provided docs      │
                └─────────────────────┘
```

### Data Flow

1. **Document Loading** (Startup)
   ```
   PDF files → pdf-parse → Text extraction → Chunking (1000 chars) → Indexing
   ```

2. **User Query** (Chat)
   ```
   User question → WebSocket → MCP Server → Document search → 
   Top-K chunks → Build context → GPT API → Stream response → 
   WebSocket → React UI update
   ```

3. **File Watching** (Real-time)
   ```
   Chokidar monitors doc/ → File event (add/change/delete) → 
   Process document → Update index → Broadcast to clients → 
   UI auto-update
   ```

### MCP Protocol Implementation

**Message Types:**

1. **Request** (Client → Server)
   ```json
   {
     "jsonrpc": "2.0",
     "id": "unique-id",
     "method": "chat.query",
     "params": { "question": "...", "conversationHistory": [...] }
   }
   ```

2. **Response** (Server → Client)
   ```json
   {
     "jsonrpc": "2.0",
     "id": "unique-id",
     "result": { "answer": "...", "sources": [...] }
   }
   ```

3. **Notification** (Server → Client, no response expected)
   ```json
   {
     "jsonrpc": "2.0",
     "method": "chat.chunk",
     "params": { "chunk": "...", "complete": false }
   }
   ```

**Event Types:**
- `documents.updated` - Document list changed
- `documents.added` - New PDF detected
- `documents.removed` - PDF deleted
- `chat.chunk` - Streaming response chunk
- `chat.status` - Processing status
- `chat.error` - Error occurred

---

## Installation

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- OpenAI API Key ([Get one](https://platform.openai.com/api-keys))
- Windows PowerShell (for scripts)

### Automated Setup

```powershell
cd C:\Users\ZoomStore\Desktop\chatbot\sam
.\setup.ps1
```

This script will:
1. Check Node.js installation
2. Install backend dependencies
3. Install frontend dependencies
4. Create .env from template

### Manual Setup

**1. Install Backend Dependencies:**
```powershell
cd C:\Users\ZoomStore\Desktop\chatbot\sam
npm install
```

**2. Install Frontend Dependencies:**
```powershell
cd vite-project
npm install
cd ..
```

**3. Configure Environment:**

Edit `.env` file:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
PORT=3001
FRONTEND_URL=http://localhost:5173
DOC_FOLDER=./doc
```

---

## Usage

### Starting the Application

**Option 1: Using Scripts (Recommended)**

Terminal 1:
```powershell
.\start-server.ps1
```

Terminal 2:
```powershell
.\start-frontend.ps1
```

**Option 2: Manual Start**

Terminal 1 - Backend:
```powershell
npm start
```

Terminal 2 - Frontend:
```powershell
cd vite-project
npm run dev
```

### Accessing the App

Open browser: **http://localhost:5173**

### Adding Documents

1. Place PDF files in `C:\Users\ZoomStore\Desktop\chatbot\sam\doc`
2. Server automatically detects and processes them
3. UI updates in real-time

### Asking Questions

1. Type your question in the input box
2. Press Enter or click Send
3. AI searches documents and generates answer
4. View sources at the bottom of each answer

---

## Technical Details

### Backend Components

#### 1. **server.js**
Main server with:
- Express HTTP server
- WebSocket server (ws)
- MCP protocol handlers
- File watcher integration
- OpenAI API integration

Key handlers:
- `documents.list` - Get all loaded documents
- `documents.search` - Search document chunks
- `chat.query` - Process user question with RAG

#### 2. **documentProcessor.js**
Handles PDF processing:
- `loadAllDocuments()` - Load all PDFs on startup
- `processDocument(filename)` - Parse single PDF
- `chunkText(text, size, overlap)` - Split into chunks
- `searchDocuments(query, topK)` - Keyword-based search
- `indexDocument()` - Add to vector store

#### 3. **mcpProtocol.js**
MCP protocol implementation:
- `handleMessage()` - Process incoming messages
- `sendRequest()` - Send request with response tracking
- `sendNotification()` - Send one-way event
- `broadcastEvent()` - Send to all connected clients

### Frontend Components

#### Hooks

**useMCPSocket.ts**
- WebSocket connection management
- Auto-reconnect with exponential backoff
- Message routing (requests/notifications)
- Event subscriptions

**useChat.ts**
- Chat state management
- Message history
- Loading states
- Send message logic

#### Components

**App.tsx**
- Main application layout
- State orchestration
- Component composition

**ChatMessage.tsx**
- Display user/AI messages
- Show sources
- Auto-scroll

**ChatInput.tsx**
- Text input
- Send functionality
- Keyboard shortcuts (Enter to send)

**DocumentList.tsx**
- Show loaded documents
- Real-time status
- File metadata

**StatusBar.tsx**
- Connection status
- Message count
- Loading indicator

### RAG Implementation

**Search Algorithm (Keyword-based):**

```javascript
1. Parse query into terms
2. For each document chunk:
   a. Count term occurrences
   b. Boost if exact phrase match
   c. Calculate relevance score
3. Sort by score descending
4. Return top-K chunks
```

**GPT Context Building:**

```javascript
System Prompt:
"You are a helpful student assistant that ONLY answers 
questions based on the provided document context.

CRITICAL RULES:
1. ONLY use information from the provided documents
2. If answer not in documents, clearly state that
3. Always cite which document you're referencing
4. Be concise and educational

Available documents context:
[Document chunks inserted here]"
```

**Streaming Response:**

Server uses OpenAI streaming API:
```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  stream: true
});

for await (const chunk of completion) {
  const content = chunk.choices[0]?.delta?.content;
  // Send each chunk via WebSocket
  mcp.sendNotification(ws, 'chat.chunk', { chunk: content });
}
```

---

## API Reference

### WebSocket Methods

#### `documents.list`
Get all loaded documents.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "documents.list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "documents": [
      {
        "filename": "doc.pdf",
        "pages": 10,
        "chunks": 25,
        "loadedAt": "2025-10-27T10:00:00Z",
        "size": 1024000
      }
    ]
  }
}
```

#### `chat.query`
Send question and get answer.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "chat.query",
  "params": {
    "question": "What is this about?",
    "conversationHistory": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "answer": "Based on the documents...",
    "sources": [
      {
        "filename": "doc.pdf",
        "chunkIndex": 5,
        "preview": "...",
        "score": 12
      }
    ],
    "hasAnswer": true,
    "relevantChunks": 3
  }
}
```

### Events (Notifications)

#### `documents.updated`
Sent when document list changes.

```json
{
  "jsonrpc": "2.0",
  "method": "documents.updated",
  "params": {
    "documents": [...]
  }
}
```

#### `chat.chunk`
Streaming response chunks.

```json
{
  "jsonrpc": "2.0",
  "method": "chat.chunk",
  "params": {
    "chunk": "Based on",
    "complete": false
  }
}
```

---

## Troubleshooting

### Common Issues

**1. Server won't start**

Error: `Port 3001 already in use`

Solution:
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**2. WebSocket connection failed**

Check:
- Server is running on port 3001
- Firewall not blocking WebSocket
- URL in `useMCPSocket.ts` is correct

**3. GPT not responding**

Check:
- API key is valid
- OpenAI account has credits
- No rate limiting

**4. PDFs not loading**

Check:
- Files are valid PDFs
- Correct permissions
- Server console for errors

**5. TypeScript errors**

```powershell
cd vite-project
npm run build
```

Check for compilation errors.

### Debug Mode

Enable verbose logging in `.env`:
```env
DEBUG=true
LOG_LEVEL=verbose
```

### Logs Location

- Server: Console output
- Frontend: Browser DevTools Console
- Network: DevTools Network tab (WS messages)

---

## Performance Optimization

### Current Setup
- Chunk size: 1000 characters
- Overlap: 200 characters
- Top-K results: 5 chunks
- Model: gpt-4o-mini (fast & cheap)

### Recommended Improvements

**For Better Accuracy:**
```javascript
// Use OpenAI embeddings
import { OpenAIEmbeddings } from 'openai';
// Compute similarity scores
// Use cosine similarity instead of keyword matching
```

**For Faster Responses:**
```javascript
// Cache frequent queries
// Pre-compute embeddings
// Use Redis for vector store
```

**For Scalability:**
```javascript
// Use proper vector database (Pinecone, Weaviate)
// Horizontal scaling with load balancer
// Separate document processing service
```

---

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions, check:
- Server logs
- Browser console
- Network tab (WebSocket messages)

---

**Built with ❤️ using React 19, MCP, and GPT**

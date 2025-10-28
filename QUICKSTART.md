# 🚀 Quick Start Guide - University AI Assistant

Get your embeddable AI chat widget running in 5 minutes!

**Author:** Ahmed Alsudairy | [GitHub](https://github.com/AhmedAlsudairy/chat-utas)

## ⚡ Fast Setup

### 1️⃣ Install Dependencies

```powershell
# Install server dependencies
npm install

# Install frontend dependencies
cd chat-widget
npm install --force
cd ..
```

### 2️⃣ Configure Environment

Create `.env` file in the root directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
DOC_FOLDER=./doc
```

**⚠️ Important:** Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)

### 3️⃣ Start the Application

**Option A: Quick Start (Recommended)**

```powershell
# Runs both server and frontend
.\setup.ps1
```

**Option B: Manual Start**

```powershell
# Terminal 1 - Start MCP Server
npm start

# Terminal 2 - Start Frontend
cd chat-widget
npm run dev
```

### 4️⃣ Use the Chat Widget

1. Open http://localhost:5173
2. Click the 💬 floating button (bottom-right corner)
3. Ask questions about university documents
4. Get AI-powered answers with sources!

## 🎯 Quick Features Overview

- 💬 **Modal Widget** - Floating chat button opens overlay
- 🌐 **Bilingual** - Auto-detects English/Arabic with RTL
- 📄 **Document RAG** - AI answers from university docs
- 🎨 **Smart Formatting** - Headers, lists, citations
- 💾 **Export Chat** - Save conversation history
- 📱 **Responsive** - Works on all devices

## 🎨 Modal Widget

- **Floating Button**: 💬 in bottom-right corner
- **Click to Open**: Modal overlay centers on screen
- **Minimal Header**: Title, status, actions (💾 Export, 🗑️ Clear, ✕ Close)
- **Smart Scroll**: Stays in place when reading history
- **Smooth Animations**: Fade-in effects and transitions

## 📚 How to Use

### Adding Documents

1. Place `.txt` files in the `doc/` folder
2. Restart the MCP server
3. Documents are automatically loaded

### Asking Questions

- Click the 💬 button to open chat
- Type your question about university regulations
- Press Enter or click Send
- View AI response with formatted headers and lists
- See source citations at the bottom

### Example Questions

- "What are the administrative divisions in the university?"
- "ما هي التقسيمات الإدارية في الجامعة؟"
- "What is the academic system and regulations?"
- "Explain the internal audit department's role"

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- WebSocket (ws)
- OpenAI GPT-4.1-nano
- MCP Protocol (JSON-RPC 2.0)

**Frontend:**
- React 19.1.1 + TypeScript 5.9.3
- Vite 7.1.12
- Custom hooks (useMCPSocket, useChat)
- CSS with RTL support

## 📁 File Structure

```
sam/
├── doc/                              # University documents
├── mcp-server/                       # Backend
│   ├── server.js
│   ├── documentProcessorOCR.js
│   └── mcpProtocol.js
├── chat-widget/src/                  # Frontend
│   ├── App.tsx                       # Modal widget
│   ├── App.css                       # Modal styles
│   ├── hooks/                        # WebSocket & chat
│   └── components/                   # Chat UI
└── .env                              # Config
```

## 🐛 Troubleshooting

**Issue**: Server won't start
- **Fix**: Check if port 3001 is available
- Run: `netstat -ano | findstr :3001`

**Issue**: WebSocket connection failed
- **Fix**: Ensure MCP server is running
- Check console for errors

**Issue**: Documents not loading
- **Fix**: Place `.txt` files in `doc/` folder
- Restart server

**Issue**: Emojis not showing
- **Fix**: File encoding issue - already fixed in latest version

**Issue**: Node.js version warning
- **Fix**: Upgrade to Node.js 22.12+ or use `npm install --force`

## � What's Next?

### Deploy Online

1. **Build frontend**: `cd chat-widget && npm run build`
2. **Deploy to Vercel**: Free, instant deployment
3. **Deploy backend**: Railway.app or Render.com

### Customize

- **Colors**: Edit `App.css` and `ChatMessage.css`
- **Position**: Change `.chat-toggle-btn` position in CSS
- **Modal Size**: Adjust `.chat-modal-content` dimensions

### Add Features

- Voice input/output
- More document formats (PDF, DOCX)
- Multi-language support
- User authentication

## 📖 More Info

- **Full Documentation**: See `README.md`
- **Technical Details**: See `DOCUMENTATION.md`

---

**Built by Ahmed Alsudairy** | [GitHub](https://github.com/AhmedAlsudairy/chat-utas) 🚀

1. **Add Embeddings**: Use OpenAI embeddings for better semantic search
2. **Multi-format Support**: Add support for DOCX, TXT files
3. **User Authentication**: Add login system
4. **Chat History**: Persist conversations
5. **Export Answers**: Download chat as PDF/TXT
6. **Advanced RAG**: Implement re-ranking and hybrid search

Enjoy your AI-powered student helper! 🎓

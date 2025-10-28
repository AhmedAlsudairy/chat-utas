# 🤖 University Document AI Assistant - Modal Widget

A modern, embeddable AI chat widget for university documents with bilingual support (English/Arabic). Built with React 19, TypeScript, MCP Server, and GPT-4.

## ✨ Features

- 💬 **Embeddable Modal Widget** - Floating chat button that opens a modal overlay
- 🌐 **Bilingual Support** - Auto-detects and formats English and Arabic text with RTL support
- 📄 **Document RAG** - Retrieval Augmented Generation using university documents
- 🔄 **Real-time Streaming** - WebSocket-based communication with streaming responses
- 📚 **OCR Support** - Processes text documents with Arabic language support
- 🎨 **Modern UI** - Blue gradient theme with smooth animations
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔍 **Smart Formatting** - Auto-detects headers, lists, and citations
- 💾 **Export Chat** - Save conversation history
- 🎯 **Smart Scroll** - Maintains scroll position when reading

## 📁 Project Structure

```
sam/
├── doc/                                    # University documents (TXT files)
│   ├── Academic_System_Decision_112_2022.txt
│   ├── Administrative_Divisions_Decision_232_2023.txt
│   ├── Decision No. 323_2023.txt
│   └── ISAM 2024.txt
├── mcp-server/                             # MCP Backend Server
│   ├── server.js                           # Main server with WebSocket
│   ├── documentProcessorOCR.js             # Document processing & RAG
│   └── mcpProtocol.js                      # MCP protocol implementation
├── vite-project/                           # React + TypeScript Frontend
│   └── src/
│       ├── App.tsx                         # Modal widget main component
│       ├── App.css                         # Modal & chat styles
│       ├── hooks/
│       │   ├── useMCPSocket.ts             # WebSocket connection hook
│       │   └── useChat.ts                  # Chat state management
│       └── components/
│           ├── ChatMessage.tsx             # Message with RTL/formatting
│           ├── ChatMessage.css             # Message styling
│           ├── ChatInput.tsx               # Input component
│           └── ChatInput.css               # Input styling
├── .env                                    # Environment variables
├── package.json                            # Server dependencies
└── README.md                               # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js (v20.19+ or v22.12+)
- OpenAI API key

### 1. Install Dependencies

```powershell
# Install server dependencies
npm install

# Install frontend dependencies
cd vite-project
npm install --force
cd ..
```

### 2. Configure Environment

Create `.env` file in root directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
DOC_FOLDER=./doc
```

### 3. Start the Application

**Option A: Using PowerShell Scripts (Recommended)**

```powershell
# Start both server and frontend
.\setup.ps1

# Or start separately:
.\start-server.ps1    # Start MCP server
.\start-frontend.ps1  # Start React app
```

**Option B: Manual Start**

```powershell
# Terminal 1 - Start MCP Server
npm start

# Terminal 2 - Start Frontend
cd vite-project
npm run dev
```

### 4. Open Application

- Frontend: http://localhost:5173
- Click the 💬 button (bottom-right) to open chat modal

## 🎯 Usage

1. **Click Chat Button**: Click the floating 💬 button to open the modal
2. **Ask Questions**: Type questions about university regulations and documents
3. **View Responses**: AI responds with formatted text, headers, and lists
4. **See Sources**: Each response shows which documents were used
5. **Export Chat**: Click � to save conversation
6. **Clear Chat**: Click 🗑️ to start fresh
7. **Close Modal**: Click ✕ to minimize

### Example Questions

- "What are the administrative divisions in the university?"
- "What is the academic system and regulations?"
- "What are the responsibilities of the quality assurance department?"
- "Explain the internal audit department's role"

## 🎨 Features

### Modal Widget Design

- **Floating Button**: Bottom-right corner, always accessible
- **Modal Overlay**: Centers on screen with backdrop
- **Minimal Header**: Title, status, and action buttons only
- **Responsive**: Works on all screen sizes

### Bilingual Support

- **Auto-detection**: Detects Arabic/English per line
- **RTL Support**: Right-to-left text for Arabic
- **Mixed Content**: Handles bilingual documents seamlessly

### Smart Formatting

- **Headers**: Detects `###`, `##`, `#` with blue styling
- **Lists**: Auto-converts `-`, `*` to bullet points (●)
- **Citations**: Numbered source cards with metadata
- **Animations**: Smooth fade-in effects

### Smart Scroll Behavior

- **User Reading**: Scroll stays in place when viewing history
- **New Messages**: Auto-scrolls only for new user/AI messages
- **Near Bottom Detection**: Resumes auto-scroll when scrolled to bottom

## 🔧 Customization

### Change Modal Position

Edit `vite-project/src/App.css`:

```css
.chat-toggle-btn {
  bottom: 24px;  /* Change vertical position */
  right: 24px;   /* Change horizontal position */
}
```

### Change Color Theme

Edit `vite-project/src/App.css` and `ChatMessage.css`:

```css
/* Primary blue: #1976d2 */
/* Dark blue: #0d47a1 */
/* Light blue: #2196f3 */
```

### Adjust Modal Size

Edit `vite-project/src/App.css`:

```css
.chat-modal-content {
  width: 90%;
  max-width: 900px;  /* Change max width */
  height: 80vh;      /* Change height */
}
```

### Add More Documents

1. Place `.txt` files in the `doc/` folder
2. Restart the MCP server
3. Documents are automatically loaded and indexed

## 📦 Dependencies

### Backend (MCP Server)

```json
{
  "express": "HTTP server",
  "ws": "WebSocket server",
  "openai": "GPT-4 integration",
  "dotenv": "Environment variables"
}
```

### Frontend (React + TypeScript)

```json
{
  "react": "19.1.1",
  "typescript": "5.9.3",
  "vite": "7.1.12"
}
```

## 🚀 Deployment

### Quick Deploy Options

**Frontend:**
- Vercel (Recommended) - Auto-deploys from GitHub
- Netlify - Drag & drop build folder
- GitHub Pages - Free static hosting

**Backend:**
- Railway.app - Easy Node.js hosting
- Render.com - Free tier available
- Fly.io - Global deployment

### Build for Production

```powershell
cd vite-project
npm run build
```

The `dist/` folder contains production-ready files.

### Deploy Backend

Update WebSocket URL in `vite-project/src/hooks/useMCPSocket.ts`:

```typescript
// Change from:
useMCPSocket('ws://localhost:3001')

// To your production backend:
useMCPSocket('wss://your-backend.railway.app')
```

## 🐛 Troubleshooting

**Issue**: Emojis not displaying
- **Fix**: File encoding issue. Edit files with UTF-8 encoding.

**Issue**: Frontend won't connect to backend
- **Fix**: Ensure MCP server is running on port 3001
- Check WebSocket URL in `useMCPSocket.ts`

**Issue**: Documents not loading
- **Fix**: Check `doc/` folder path in `.env`
- Ensure files are `.txt` format
- Restart MCP server

**Issue**: Node.js version warning
- **Fix**: Upgrade to Node.js 22.12+ or ignore with `--force` flag

## � Documentation Files

- `README.md` - This file (main documentation)
- `QUICKSTART.md` - Quick setup guide
- `DOCUMENTATION.md` - Detailed technical documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## � License

MIT License - Feel free to use for personal or commercial projects.

## 🆘 Support

For issues or questions:
1. Check this README
2. Review `DOCUMENTATION.md`
3. Check browser console for errors
4. Check server console logs

---

**Built with ❤️ for university document management**

MIT

## 👨‍💻 Author

Built with ❤️ using React 19, MCP, and GPT

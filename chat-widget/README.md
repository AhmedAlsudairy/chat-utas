# University AI Assistant - Frontend

Embeddable modal chat widget built with React 19 + TypeScript + Vite.

**Author:** Ahmed Alsudairy | [GitHub](https://github.com/AhmedAlsudairy/chat-utas)

## 🚀 Quick Start

```bash
# Install dependencies
npm install --force

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Features

- **Modal Widget**: Floating 💬 button with overlay modal
- **Bilingual Support**: Auto-detects English/Arabic with RTL
- **Smart Formatting**: Headers (###), lists, citations
- **Real-time Streaming**: WebSocket-based chat
- **Smooth Animations**: Fade-in effects and transitions
- **Responsive Design**: Works on all screen sizes

## 📁 Structure

```
src/
├── App.tsx                 # Modal widget main component
├── App.css                 # Modal and layout styles
├── hooks/
│   ├── useMCPSocket.ts    # WebSocket connection
│   └── useChat.ts         # Chat state management
└── components/
    ├── ChatMessage.tsx    # Message with formatting
    ├── ChatMessage.css    # Message styles
    ├── ChatInput.tsx      # Input component
    └── ChatInput.css      # Input styles
```

## 🛠️ Tech Stack

- **React 19.1.1** - Latest React with new hooks
- **TypeScript 5.9.3** - Type safety
- **Vite 7.1.12** - Fast build tool
- **WebSocket** - Real-time communication

## 🎯 Components

### App.tsx
Main modal widget with floating button, overlay, and chat interface.

### ChatMessage.tsx
- Auto-detects Arabic/English per line
- Renders headers with special styling
- Converts lists to bullet points
- Shows source citations with metadata

### ChatInput.tsx
- Textarea with auto-resize
- Send button with loading state
- Keyboard shortcuts (Enter to send)

## 🔧 Configuration

### WebSocket URL

Edit `src/hooks/useMCPSocket.ts`:

```typescript
useMCPSocket('ws://localhost:3001')  // Development
useMCPSocket('wss://your-backend.com')  // Production
```

### Modal Styling

Edit `src/App.css`:

```css
.chat-toggle-btn {
  bottom: 24px;  /* Position */
  right: 24px;
}

.chat-modal-content {
  max-width: 900px;  /* Size */
  height: 80vh;
}
```

## 📦 Build

```bash
npm run build
```

Output: `dist/` folder ready for deployment

## 🚀 Deploy

- **Vercel**: Push to GitHub, auto-deploy
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Static hosting

## 📖 More Info

See main project README for full documentation.

---

**Created by Ahmed Alsudairy** | [GitHub](https://github.com/AhmedAlsudairy/chat-utas)

// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

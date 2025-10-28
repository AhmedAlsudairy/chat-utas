import { useRef, useEffect, useState } from 'react';
import { useMCPSocket } from './hooks/useMCPSocket.ts';
import { useChat } from './hooks/useChat.ts';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import './App.css';

function App() {
  const { isConnected, sendRequest, subscribe } = useMCPSocket('ws://localhost:3001');
  const { messages, isLoading, sendMessage, clearMessages, exportChat } = useChat(sendRequest, subscribe);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' || (lastMessage.role === 'assistant' && !lastMessage.content)) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length, shouldAutoScroll]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  return (
    <>
      <button 
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      <div className={`chat-modal ${isOpen ? 'open' : ''}`}>
        <div className="chat-modal-content">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon">🤖</span>
              <h2>AI Assistant</h2>
              <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '●' : '○'}
              </span>
            </div>
            <div className="chat-actions">
              <button 
                className="action-btn export-btn" 
                onClick={exportChat} 
                disabled={messages.length === 0}
                title="Export chat"
              >
                💾
              </button>
              <button 
                className="action-btn clear-btn" 
                onClick={clearMessages} 
                disabled={messages.length === 0}
                title="Clear chat"
              >
                🗑️
              </button>
              <button 
                className="action-btn close-btn" 
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>👋 Welcome! | مرحباً بك!</h2>
                <p>I'm your AI assistant for University documents. Ask me anything about the regulations, decisions, and policies.</p>
                <p className="rtl" dir="rtl">أنا مساعدك الذكي لمستندات الجامعة. اسألني عن اللوائح والقرارات والسياسات.</p>
                <div className="example-questions">
                  <h3>📌 Common Questions:</h3>
                  <div className="question-suggestions">
                    <button onClick={() => sendMessage("What are the administrative divisions in the university?")} className="question-btn">
                      🏢 What are the administrative divisions?
                    </button>
                    <button onClick={() => sendMessage("ما هي التقسيمات الإدارية في الجامعة؟")} className="question-btn rtl-btn" dir="rtl">
                      🏢 ما هي التقسيمات الإدارية؟
                    </button>
                    <button onClick={() => sendMessage("What is the academic system and regulations?")} className="question-btn">
                      📚 Academic system and regulations?
                    </button>
                    <button onClick={() => sendMessage("ما هو النظام الأكاديمي واللوائح؟")} className="question-btn rtl-btn" dir="rtl">
                      📚 ما هو النظام الأكاديمي؟
                    </button>
                    <button onClick={() => sendMessage("What are the responsibilities of the quality assurance department?")} className="question-btn">
                      ✅ Quality assurance responsibilities?
                    </button>
                    <button onClick={() => sendMessage("ما هي مسؤوليات قسم ضمان الجودة؟")} className="question-btn rtl-btn" dir="rtl">
                      ✅ مسؤوليات ضمان الجودة؟
                    </button>
                    <button onClick={() => sendMessage("Explain the internal audit department's role")} className="question-btn">
                      🔍 Internal audit department role?
                    </button>
                    <button onClick={() => sendMessage("اشرح دور دائرة التدقيق الداخلي")} className="question-btn rtl-btn" dir="rtl">
                      🔍 دور التدقيق الداخلي؟
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput onSend={sendMessage} disabled={!isConnected || isLoading} />
        </div>
      </div>
    </>
  );
}

export default App;

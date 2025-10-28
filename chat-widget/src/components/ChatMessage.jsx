import { useEffect, useRef } from 'react';
import './ChatMessage.css';

export const ChatMessage = ({ message }) => {
  const messageRef = useRef(null);

  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [message.content]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div ref={messageRef} className={`chat-message ${message.role}`}>
      <div className="message-header">
        <span className="message-role">
          {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        {message.content || <span className="typing">Thinking...</span>}
        {message.error && <span className="error-badge">⚠️ Error</span>}
      </div>

      {message.sources && message.sources.length > 0 && (
        <div className="message-sources">
          <div className="sources-header">📚 Sources:</div>
          {message.sources.map((source, idx) => (
            <div key={idx} className="source-item">
              <div className="source-filename">
                📄 {source.filename} (Chunk {source.chunkIndex + 1})
              </div>
              <div className="source-preview">{source.preview}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

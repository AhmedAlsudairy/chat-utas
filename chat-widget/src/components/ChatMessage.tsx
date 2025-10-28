import { useEffect, useRef, useState } from 'react';
import './ChatMessage.css';

interface Source {
  filename: string;
  chunkIndex: number;
  preview: string;
  score: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  hasAnswer?: boolean;
  error?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [message.content]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Detect if content contains Arabic text
  const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
  const isArabicContent = hasArabic(message.content);

  // Format content with better line breaks and structure
  const formatContent = (content: string) => {
    // Preserve original formatting but improve readability
    return content
      .split('\n')
      .map((line, idx) => {
        // Detect if this line is Arabic or English
        const lineIsArabic = hasArabic(line);
        
        // Check if line is a header (starts with ###, ##, or #)
        const headerMatch = line.match(/^(#{1,3})\s*(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          const headerIsArabic = hasArabic(text);
          return (
            <div 
              key={idx} 
              className={`content-header header-${level} ${headerIsArabic ? 'rtl' : 'ltr'}`}
              dir={headerIsArabic ? 'rtl' : 'ltr'}
            >
              {text}
            </div>
          );
        }
        
        // Check if line is a list item (starts with -, *, or number)
        const listMatch = line.match(/^(\s*)([-*•]|\d+[\.)]\s*)\s*(.+)$/);
        if (listMatch) {
          const indent = listMatch[1];
          const bullet = listMatch[2];
          const text = listMatch[3];
          const listIsArabic = hasArabic(text);
          
          // Clean up bullet formatting
          let displayBullet = bullet.trim();
          if (displayBullet === '-' || displayBullet === '*' || displayBullet === '•') {
            displayBullet = '●';
          }
          
          return (
            <div 
              key={idx} 
              className={`content-list ${listIsArabic ? 'rtl' : 'ltr'}`}
              dir={listIsArabic ? 'rtl' : 'ltr'}
              style={{ 
                paddingLeft: listIsArabic ? '0' : `${indent.length * 8 + 8}px`, 
                paddingRight: listIsArabic ? `${indent.length * 8 + 8}px` : '0' 
              }}
            >
              <span className="bullet">{displayBullet}</span>
              <span className="list-text">{text}</span>
            </div>
          );
        }
        
        return (
          <div 
            key={idx} 
            className={`content-line ${lineIsArabic ? 'rtl' : 'ltr'}`}
            dir={lineIsArabic ? 'rtl' : 'ltr'}
          >
            {line || <br />}
          </div>
        );
      });
  };

  return (
    <div 
      ref={messageRef} 
      className={`chat-message ${message.role} ${isArabicContent ? 'arabic-content' : ''}`}
    >
      <div className="message-header">
        <span className="message-role">
          {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        {message.content ? (
          formatContent(message.content)
        ) : (
          <span className="typing">Thinking...</span>
        )}
        {message.error && <span className="error-badge">⚠️ Error</span>}
      </div>

      {message.sources && message.sources.length > 0 && (
        <div className="message-sources">
          <div 
            className="sources-header clickable" 
            onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
          >
            <span className={`sources-arrow ${isSourcesExpanded ? 'expanded' : ''}`}>
              ▶
            </span>
            <span className="sources-icon">📚</span>
            <span className="sources-label">
              <span className="ltr">Sources ({message.sources.length})</span>
              <span className="separator">|</span>
              <span className="rtl" dir="rtl">المصادر ({message.sources.length})</span>
            </span>
          </div>
          {isSourcesExpanded && (
            <div className="sources-list">
              {message.sources.map((source, idx) => {
                const previewIsArabic = hasArabic(source.preview);
                return (
                  <div key={idx} className="source-item">
                    <div className="source-header">
                      <span className="source-number">{idx + 1}</span>
                      <div className="source-filename">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{source.filename}</span>
                      </div>
                    </div>
                    <div className="source-metadata">
                      <span className="source-chunk">
                        Section {source.chunkIndex + 1}
                      </span>
                      <span className="source-score">
                        {Math.round(source.score * 100)}% match
                      </span>
                    </div>
                    <div 
                      className={`source-preview ${previewIsArabic ? 'rtl' : 'ltr'}`}
                      dir={previewIsArabic ? 'rtl' : 'ltr'}
                    >
                      {source.preview}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

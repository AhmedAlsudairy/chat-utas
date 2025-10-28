import './StatusBar.css';

interface Document {
  filename: string;
  pages: number;
  chunks: number;
  loadedAt: string;
  size: number;
}

interface StatusBarProps {
  isLoading: boolean;
  messageCount: number;
  documents: Document[];
}

export const StatusBar = ({ isLoading, messageCount, documents }: StatusBarProps) => {
  const hasHistory = messageCount > 0;
  
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">💬 Messages:</span>
        <span className="status-value">{messageCount}</span>
      </div>
      
      <div className="status-item">
        <span className="status-label">📚 Documents:</span>
        <span className="status-value">{documents.length}</span>
      </div>

      {hasHistory && (
        <div className="status-item">
          <span className="status-label">💾 Chat saved to memory</span>
        </div>
      )}
      
      {isLoading && (
        <div className="status-item loading">
          <span className="spinner">⏳</span>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

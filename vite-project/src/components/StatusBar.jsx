import './StatusBar.css';

export const StatusBar = ({ isLoading, messageCount, documents }) => {
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
      
      {isLoading && (
        <div className="status-item loading">
          <span className="spinner">⏳</span>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

import './DocumentList.css';

interface Document {
  filename: string;
  pages: number;
  chunks: number;
  loadedAt: string;
  size: number;
}

interface DocumentListProps {
  documents: Document[];
  isConnected: boolean;
}

export const DocumentList = ({ documents, isConnected }: DocumentListProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="document-list">
      <div className="document-header">
        <h3>📚 Available Documents</h3>
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="no-documents">
          <p>📭 No documents loaded</p>
          <p className="hint">Add PDF files to the doc/ folder</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((doc, idx) => (
            <div key={idx} className="document-card">
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-name" title={doc.filename}>
                  {doc.filename}
                </div>
                <div className="doc-meta">
                  <span>📖 {doc.pages} pages</span>
                  <span>🧩 {doc.chunks} chunks</span>
                  <span>💾 {formatFileSize(doc.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

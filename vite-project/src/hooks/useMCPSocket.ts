import { useState, useEffect, useCallback, useRef } from 'react';

interface Document {
  filename: string;
  pages: number;
  chunks: number;
  loadedAt: string;
  size: number;
}

export const useMCPSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const messageHandlers = useRef(new Map<string, Function>());
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('🔌 Connected to MCP Server');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (!message.id && message.method) {
            const handler = messageHandlers.current.get(message.method);
            if (handler) {
              handler(message.params);
            }
          }
          
          if (message.id) {
            const handler = messageHandlers.current.get(`response_${message.id}`);
            if (handler) {
              handler(message.result);
              messageHandlers.current.delete(`response_${message.id}`);
            }
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        console.log('👋 Disconnected from MCP Server');
        setIsConnected(false);
        
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimer.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
      };

      setSocket(ws);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect');
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendRequest = useCallback((method: string, params: any = {}) => {
    return new Promise((resolve, reject) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `${Date.now()}_${Math.random()}`;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      messageHandlers.current.set(`response_${id}`, resolve);

      socket.send(JSON.stringify(message));

      window.setTimeout(() => {
        if (messageHandlers.current.has(`response_${id}`)) {
          messageHandlers.current.delete(`response_${id}`);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }, [socket]);

  const subscribe = useCallback((eventType: string, handler: Function) => {
    messageHandlers.current.set(eventType, handler);
    
    return () => {
      messageHandlers.current.delete(eventType);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe('documents.updated', (params: any) => {
      setDocuments(params.documents || []);
    });

    const unsubscribeAdded = subscribe('documents.added', (params: any) => {
      setDocuments(params.documents || []);
    });

    const unsubscribeRemoved = subscribe('documents.removed', (params: any) => {
      setDocuments(params.documents || []);
    });

    return () => {
      unsubscribe();
      unsubscribeAdded();
      unsubscribeRemoved();
    };
  }, [subscribe]);

  return {
    isConnected,
    documents,
    error,
    sendRequest,
    subscribe
  };
};

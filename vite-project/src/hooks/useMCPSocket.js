import { useState, useEffect, useCallback, useRef } from 'react';

export const useMCPSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  
  const messageHandlers = useRef(new Map());
  const reconnectTimer = useRef(null);
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
          
          // Handle notifications
          if (!message.id && message.method) {
            const handler = messageHandlers.current.get(message.method);
            if (handler) {
              handler(message.params);
            }
          }
          
          // Handle responses
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
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimer.current = setTimeout(() => {
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

  const sendRequest = useCallback((method, params = {}) => {
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

      // Register response handler
      messageHandlers.current.set(`response_${id}`, resolve);

      socket.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (messageHandlers.current.has(`response_${id}`)) {
          messageHandlers.current.delete(`response_${id}`);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }, [socket]);

  const subscribe = useCallback((eventType, handler) => {
    messageHandlers.current.set(eventType, handler);
    
    return () => {
      messageHandlers.current.delete(eventType);
    };
  }, []);

  // Subscribe to document updates
  useEffect(() => {
    const unsubscribe = subscribe('documents.updated', (params) => {
      setDocuments(params.documents || []);
    });

    const unsubscribeAdded = subscribe('documents.added', (params) => {
      setDocuments(params.documents || []);
    });

    const unsubscribeRemoved = subscribe('documents.removed', (params) => {
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

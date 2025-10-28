import { v4 as uuidv4 } from 'uuid';

export class MCPProtocol {
  constructor() {
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
  }

  registerHandler(method, handler) {
    this.messageHandlers.set(method, handler);
  }

  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      // Handle responses to our requests
      if (data.id && this.pendingRequests.has(data.id)) {
        const resolver = this.pendingRequests.get(data.id);
        this.pendingRequests.delete(data.id);
        resolver(data);
        return;
      }

      // Handle incoming requests
      const handler = this.messageHandlers.get(data.method);
      if (handler) {
        const result = await handler(data.params, ws);
        
        if (data.id) {
          this.sendResponse(ws, data.id, result);
        }
      } else {
        this.sendError(ws, data.id, `Unknown method: ${data.method}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(ws, null, error.message);
    }
  }

  sendRequest(ws, method, params = {}) {
    const id = uuidv4();
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, resolve);
      
      ws.send(JSON.stringify(message));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  sendNotification(ws, method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      method,
      params
    };
    ws.send(JSON.stringify(message));
  }

  sendResponse(ws, id, result) {
    const message = {
      jsonrpc: '2.0',
      id,
      result
    };
    ws.send(JSON.stringify(message));
  }

  sendError(ws, id, error) {
    const message = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: typeof error === 'string' ? error : error.message
      }
    };
    ws.send(JSON.stringify(message));
  }

  // Event patterns for real-time triggers
  broadcastEvent(wss, eventType, data) {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        this.sendNotification(client, eventType, data);
      }
    });
  }
}

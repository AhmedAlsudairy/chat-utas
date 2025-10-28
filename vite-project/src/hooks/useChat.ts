import { useState, useCallback, useEffect } from 'react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    filename: string;
    chunkIndex: number;
    preview: string;
    score: number;
  }>;
  hasAnswer?: boolean;
  error?: boolean;
}

const CHAT_STORAGE_KEY = 'chatbot_conversation_history';

// Load messages from localStorage
const loadMessagesFromStorage = (): Message[] => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
};

// Save messages to localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

export const useChat = (sendRequest: any, subscribe: any) => {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');

    const assistantMessageId = Date.now() + 1;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      sources: []
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await sendRequest('chat.query', {
        question,
        conversationHistory
      });

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: response.answer, sources: response.sources, hasAnswer: response.hasAnswer }
          : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Sorry, an error occurred while processing your question.', error: true }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  }, [messages, sendRequest]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage('');
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, []);

  const exportChat = useCallback(() => {
    const chatText = messages
      .map(msg => {
        const role = msg.role === 'user' ? 'You' : 'AI Assistant';
        const timestamp = new Date(msg.timestamp).toLocaleString();
        let text = `[${timestamp}] ${role}:\n${msg.content}\n`;
        
        if (msg.sources && msg.sources.length > 0) {
          text += '\nSources:\n';
          msg.sources.forEach((source, idx) => {
            text += `  ${idx + 1}. ${source.filename} (Chunk ${source.chunkIndex + 1})\n`;
          });
        }
        return text;
      })
      .join('\n---\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    streamingMessage,
    sendMessage,
    clearMessages,
    exportChat
  };
};

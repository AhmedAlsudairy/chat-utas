import { useState, useCallback, useRef } from 'react';

export const useChat = (sendRequest, subscribe) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const currentAnswerRef = useRef('');

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');
    currentAnswerRef.current = '';

    // Create assistant message placeholder
    const assistantMessageId = Date.now() + 1;
    const assistantMessage = {
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

      // Send query to MCP server
      const response = await sendRequest('chat.query', {
        question,
        conversationHistory
      });

      // Update the assistant message with the full response
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
      currentAnswerRef.current = '';
    }
  }, [messages, sendRequest]);

  // Handle streaming chunks
  useState(() => {
    if (subscribe) {
      const unsubscribeChunk = subscribe('chat.chunk', (params) => {
        if (params.complete) {
          setStreamingMessage('');
          currentAnswerRef.current = '';
        } else {
          currentAnswerRef.current += params.chunk;
          setStreamingMessage(currentAnswerRef.current);
          
          // Update the last assistant message with streaming content
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return prev.map((msg, idx) => 
                idx === prev.length - 1 
                  ? { ...msg, content: currentAnswerRef.current }
                  : msg
              );
            }
            return prev;
          });
        }
      });

      const unsubscribeStatus = subscribe('chat.status', (params) => {
        console.log('Status:', params);
      });

      return () => {
        unsubscribeChunk();
        unsubscribeStatus();
      };
    }
  }, [subscribe]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage('');
    currentAnswerRef.current = '';
  }, []);

  return {
    messages,
    isLoading,
    streamingMessage,
    sendMessage,
    clearMessages
  };
};

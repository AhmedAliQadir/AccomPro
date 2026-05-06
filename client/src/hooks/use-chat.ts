import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolActivity?: string[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    const assistantMessage: ChatMessage = { role: 'assistant', content: '', toolActivity: [] };
    setMessages(prev => [...prev, assistantMessage]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: content, conversationId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'text') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content };
                }
                return updated;
              });
            } else if (event.type === 'tool_start') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  const activity = [...(last.toolActivity || []), event.tool];
                  updated[updated.length - 1] = { ...last, toolActivity: activity };
                }
                return updated;
              });
            } else if (event.type === 'done') {
              if (event.conversationId) {
                setConversationId(event.conversationId);
              }
            } else if (event.type === 'error') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: event.message };
                }
                return updated;
              });
            }
          } catch {
            // Skip unparseable events
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant' && !last.content) {
            updated[updated.length - 1] = { ...last, content: `Error: ${error.message}` };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversationId, isStreaming]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { credentials: 'include' });
      if (!response.ok) return;
      const { conversation } = await response.json();
      const rawMessages = conversation.messages as Array<{ role: string; content: string }>;
      const parsed: ChatMessage[] = rawMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .filter(m => typeof m.content === 'string')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      setMessages(parsed);
      setConversationId(id);
    } catch {
      // Ignore load errors
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    loadConversation,
    clearConversation,
    stopStreaming,
  };
}

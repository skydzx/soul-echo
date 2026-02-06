import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function useChat(characterId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!characterId || !content.trim()) return;

    setLoading(true);
    setError(null);
    setStreaming(true);

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 添加一个空的AI消息用于流式更新
    const botMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMessage]);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character_id: characterId,
          message: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === 'START') {
              continue;
            }

            if (data === 'END') {
              setStreaming(false);
              setLoading(false);
              break;
            }

            if (data.startsWith('ERROR')) {
              try {
                const errorData = JSON.parse(data.slice(6));
                throw new Error(errorData.error || '流式响应错误');
              } catch {
                throw new Error('流式响应错误');
              }
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                // 更新AI消息内容
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1].content = assistantContent;
                  }
                  return newMessages;
                });
                setTimeout(scrollToBottom, 50);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息失败');
      // 移除空的AI消息
      setMessages((prev) => prev.filter((m) => m.role !== 'assistant' || m.content));
      setStreaming(false);
      setLoading(false);
    }
  }, [characterId, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    if (!characterId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chat/history/${characterId}?offset=0&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setTotalMessages(data.total);
        setHasMore(data.has_more);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('加载历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [characterId, scrollToBottom]);

  const loadMoreHistory = useCallback(async () => {
    if (!characterId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await fetch(
        `${API_BASE}/chat/history/${characterId}?offset=${messages.length}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        // 插入到开头
        setMessages((prev) => [...data.messages, ...prev]);
        setTotalMessages(data.total);
        setHasMore(data.has_more);
      }
    } catch (err) {
      console.error('加载更多历史记录失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [characterId, messages.length, loadingMore, hasMore]);

  const searchHistory = useCallback(async (query: string) => {
    if (!characterId || !query.trim()) return [];

    try {
      const response = await fetch(
        `${API_BASE}/chat/history/${characterId}/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('搜索历史记录失败:', err);
    }
    return null;
  }, [characterId]);

  const exportHistory = useCallback(async () => {
    if (!characterId) return null;

    try {
      const response = await fetch(`${API_BASE}/chat/history/${characterId}/export`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('导出历史记录失败:', err);
    }
    return null;
  }, [characterId]);

  const clearMessages = useCallback(async () => {
    if (!characterId) return;

    try {
      await fetch(`${API_BASE}/chat/history/${characterId}`, { method: 'DELETE' });
      setMessages([]);
      setTotalMessages(0);
    } catch (err) {
      console.error('清空聊天记录失败:', err);
    }
  }, [characterId]);

  const getStats = useCallback(async () => {
    if (!characterId) return null;

    try {
      const response = await fetch(`${API_BASE}/chat/history/${characterId}/stats`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('获取统计信息失败:', err);
    }
    return null;
  }, [characterId]);

  return {
    messages,
    loading,
    loadingMore,
    streaming,
    error,
    hasMore,
    totalMessages,
    sendMessage,
    loadHistory,
    loadMoreHistory,
    searchHistory,
    exportHistory,
    clearMessages,
    getStats,
    messagesEndRef,
  };
}

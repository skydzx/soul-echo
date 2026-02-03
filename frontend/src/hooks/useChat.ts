import { useState, useRef, useCallback } from 'react';
import { chatApi } from '@/services/api';
import type { ChatMessage } from '@/types';

export function useChat(characterId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = async (content: string) => {
    if (!characterId || !content.trim()) return;

    setLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatApi.send({
        character_id: characterId,
        message: content.trim(),
      });

      const botMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, botMessage]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError('发送消息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = useCallback(async () => {
    if (!characterId) return;

    try {
      const history = await chatApi.getHistory(characterId);
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('加载历史记录失败:', err);
    }
  }, [characterId, scrollToBottom]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadHistory,
    clearMessages,
    messagesEndRef,
  };
}

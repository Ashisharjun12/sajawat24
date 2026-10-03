import * as chatApi from '@/api/chat.api';
import { useSocket } from '@/providers/socket-provider';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

function useChatFocus(conversationId: string | undefined) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('chat:focus', { conversationId });
    return () => {
      socket.emit('chat:blur', {});
    };
  }, [socket, conversationId]);
}
function newClientMessageId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useBookingChatThread(orderId: string, options?: { enabled?: boolean }) {
  const chatEnabled = options?.enabled !== false && Boolean(orderId);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const pendingMessages = useChatStore((s) => s.pendingMessages);

  const conversationQuery = useQuery({
    queryKey: ['chat', 'booking', orderId],
    queryFn: () => chatApi.getBookingConversation(orderId),
    enabled: chatEnabled,
    refetchInterval: 15000,
  });

  const conversationId = conversationQuery.data?.id;

  useChatFocus(conversationId);
  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) throw new Error('No conversation');
      const clientMessageId = newClientMessageId();
      useChatStore.getState().addPendingMessage(conversationId, {
        clientMessageId,
        conversationId,
        body,
        createdAt: new Date().toISOString(),
      });
      try {
        const msg = await chatApi.sendMessage(conversationId, { body, clientMessageId });
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId);
        return msg;
      } catch (err) {
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId);
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
    },
  });

  const mergedMessages = useMemo(() => {
    const server = messagesQuery.data ?? [];
    const pending = conversationId ? pendingMessages[conversationId] ?? [] : [];
    const serverClientIds = new Set(server.map((m) => m.clientMessageId).filter(Boolean));
    const pendingViews = pending
      .filter((p) => !serverClientIds.has(p.clientMessageId))
      .map((p) => ({
        id: p.clientMessageId,
        conversationId: p.conversationId,
        sequence: Number.MAX_SAFE_INTEGER,
        senderUserId: userId ?? null,
        senderRole: 'vendor',
        body: p.body,
        messageType: p.messageType ?? 'text',
        attachmentUrl: p.attachmentUri ?? null,
        clientMessageId: p.clientMessageId,
        createdAt: p.createdAt,
        readStatus: 'sent' as const,
      }));
    return [...server, ...pendingViews];
  }, [messagesQuery.data, pendingMessages, conversationId, userId]);

  useEffect(() => {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && conversationId) {
      void chatApi.markRead(conversationId, last.id).catch(() => {});
    }
  }, [mergedMessages, conversationId]);

  return {
    conversation: conversationQuery.data,
    messages: mergedMessages,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    error: conversationQuery.error ?? messagesQuery.error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

export function useSupportChatThread() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const pendingMessages = useChatStore((s) => s.pendingMessages);

  const conversationQuery = useQuery({
    queryKey: ['chat', 'support'],
    queryFn: () => chatApi.openVendorSupport(),
  });

  const conversationId = conversationQuery.data?.id;

  useChatFocus(conversationId);
  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) throw new Error('No conversation');
      const clientMessageId = newClientMessageId();
      useChatStore.getState().addPendingMessage(conversationId, {
        clientMessageId,
        conversationId,
        body,
        createdAt: new Date().toISOString(),
      });
      try {
        const msg = await chatApi.sendMessage(conversationId, { body, clientMessageId });
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId);
        return msg;
      } catch (err) {
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId);
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
    },
  });

  const mergedMessages = useMemo(() => {
    const server = messagesQuery.data ?? [];
    const pending = conversationId ? pendingMessages[conversationId] ?? [] : [];
    const serverClientIds = new Set(server.map((m) => m.clientMessageId).filter(Boolean));
    const pendingViews = pending
      .filter((p) => !serverClientIds.has(p.clientMessageId))
      .map((p) => ({
        id: p.clientMessageId,
        conversationId: p.conversationId,
        sequence: Number.MAX_SAFE_INTEGER,
        senderUserId: userId ?? null,
        senderRole: 'vendor',
        body: p.body,
        messageType: p.messageType ?? 'text',
        attachmentUrl: p.attachmentUri ?? null,
        clientMessageId: p.clientMessageId,
        createdAt: p.createdAt,
        readStatus: 'sent' as const,
      }));
    return [...server, ...pendingViews];
  }, [messagesQuery.data, pendingMessages, conversationId, userId]);

  useEffect(() => {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && conversationId) {
      void chatApi.markRead(conversationId, last.id).catch(() => {});
    }
  }, [mergedMessages, conversationId]);

  return {
    conversation: conversationQuery.data,
    messages: mergedMessages,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    error: conversationQuery.error ?? messagesQuery.error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

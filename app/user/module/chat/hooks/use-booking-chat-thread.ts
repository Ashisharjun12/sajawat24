import * as chatApi from '@/api/chat.api';
import { queryKeys } from '@/lib/query-keys';
import { newClientMessageId } from '@/module/chat/lib/client-message-id';
import { CHAT_BLUR_EVENT, CHAT_FOCUS_EVENT } from '@/module/chat/lib/chat-events';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

function useChatFocus(conversationId: string | undefined) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit(CHAT_FOCUS_EVENT, { conversationId });
    return () => {
      socket.emit(CHAT_BLUR_EVENT, {});
    };
  }, [socket, conversationId]);
}

export function useBookingChatThread(orderId: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false && Boolean(orderId);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const pendingMessages = useChatStore((s) => s.pendingMessages);

  const conversationQuery = useQuery({
    queryKey: queryKeys.chatBooking(orderId),
    queryFn: () => chatApi.getBookingConversation(orderId),
    enabled,
    refetchInterval: 15_000,
  });

  const conversationId = conversationQuery.data?.id;

  useChatFocus(conversationId);
  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  const messagesQuery = useQuery({
    queryKey: queryKeys.chatMessages(conversationId ?? ''),
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: Boolean(conversationId),
    refetchInterval: connectionStatus === 'disconnected' ? 8000 : false,
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
        messageType: 'text',
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(conversationId!) });
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
        senderRole: 'customer',
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
    if (!last || !conversationId) return;
    const pending = conversationId ? pendingMessages[conversationId] ?? [] : [];
    if (pending.some((p) => p.clientMessageId === last.id)) return;
    void chatApi.markConversationRead(conversationId, last.id).catch(() => {});
  }, [mergedMessages, conversationId, pendingMessages]);

  return {
    conversation: conversationQuery.data,
    messages: mergedMessages,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    error: conversationQuery.error ?? messagesQuery.error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

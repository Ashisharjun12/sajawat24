import * as chatApi from '@/api/chat.api';
import { queryKeys } from '@/lib/query-keys';
import { newClientMessageId } from '@/module/chat/lib/client-message-id';
import { CHAT_BLUR_EVENT, CHAT_FOCUS_EVENT } from '@/module/chat/lib/chat-events';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback, useEffect, useMemo } from 'react';

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

export function useSupportTopicChatThread(
  topicKey: string,
  subject: string | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false && Boolean(topicKey);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const pendingMessages = useChatStore((s) => s.pendingMessages);

  // Opening a topic POSTs /user/chat/support: it returns the open chat for this topic, or
  // creates a new one when the last chat was closed. It is NOT polled — polling a POST
  // used to silently reopen chats right after support closed them. Status changes arrive
  // over the socket (`chat:status`, see SocketProvider).
  const conversationQuery = useQuery({
    queryKey: queryKeys.chatSupport(topicKey),
    queryFn: () =>
      chatApi.openCustomerSupport({
        topicKey,
        subject: subject ?? topicKey,
      }),
    enabled,
    staleTime: Infinity,
    // Every visit asks again, so coming back after a close lands in a fresh chat.
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const conversationId = conversationQuery.data?.id;
  const isClosed = conversationQuery.data?.status === 'closed';
  const { refetch: refetchConversation } = conversationQuery;

  /** After support closed the chat: open a fresh one (old messages are left behind). */
  const startNewChat = useCallback(async () => {
    await refetchConversation();
  }, [refetchConversation]);

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
    onError: (err) => {
      // 409 = support closed this chat (socket event may have been missed): show it closed.
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        queryClient.setQueryData<chatApi.ChatConversation>(queryKeys.chatSupport(topicKey), (old) =>
          old ? { ...old, status: 'closed' } : old,
        );
        if (conversationId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(conversationId) });
        }
      }
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
    /** Support closed this chat — hide the composer, offer "Start a new chat". */
    isClosed,
    startNewChat,
    isStartingNewChat: conversationQuery.isFetching && isClosed,
  };
}

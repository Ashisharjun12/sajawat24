import type { ChatConversation, ChatMessage } from '@/api/chat.api';
import { getSocketUrl } from '@/lib/socket-url';
import { queryKeys } from '@/lib/query-keys';
import {
  CHAT_MESSAGE_EVENT,
  CHAT_READ_EVENT,
  CHAT_STATUS_EVENT,
} from '@/module/chat/lib/chat-events';
import { patchReadStatus } from '@/module/chat/lib/chat-utils';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketContextValue = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextValue>({ socket: null });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url = getSocketUrl();
    if (!accessToken || !url) {
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      useChatStore.getState().setConnectionStatus('idle');
      return;
    }

    useChatStore.getState().setConnectionStatus('connecting');
    const instance = io(url, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    instance.on('connect', () => {
      useChatStore.getState().setConnectionStatus('connected');
    });

    instance.on('disconnect', () => {
      useChatStore.getState().setConnectionStatus('disconnected');
    });

    instance.on(CHAT_MESSAGE_EVENT, (payload: { conversationId?: string }) => {
      if (payload?.conversationId) {
        useChatStore.getState().onIncomingMessage(payload.conversationId);
        const activeId = useChatStore.getState().activeConversationId;
        if (activeId !== payload.conversationId) {
          void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        }
      }
      // Refresh chat data — except the support "open" query: refetching it POSTs
      // /user/chat/support, which would replace a just-closed chat with a new one.
      void queryClient.invalidateQueries({
        queryKey: ['chat'],
        predicate: (query) => query.queryKey[1] !== 'support',
      });
    });

    // Support closed/reopened the chat: flip its status in place so the open screen
    // shows "closed" at once, and reload its messages (includes "Ticket closed by admin").
    instance.on(
      CHAT_STATUS_EVENT,
      (payload: { conversationId?: string; status?: ChatConversation['status'] }) => {
        const { conversationId, status } = payload ?? {};
        if (!conversationId || !status) return;
        queryClient.setQueriesData<ChatConversation>({ queryKey: ['chat'] }, (old) =>
          old && typeof old === 'object' && 'id' in old && old.id === conversationId
            ? { ...old, status }
            : old,
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(conversationId) });
      },
    );

    instance.on(
      CHAT_READ_EVENT,
      (payload: { conversationId?: string; readUpToSequence?: number }) => {
        if (!payload?.conversationId || !payload.readUpToSequence) return;
        queryClient.setQueryData<ChatMessage[]>(
          queryKeys.chatMessages(payload.conversationId),
          (old) => patchReadStatus(old, payload.readUpToSequence),
        );
      },
    );

    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (socket && accessToken) {
      socket.auth = { token: accessToken };
      if (!socket.connected) socket.connect();
    }
  }, [accessToken, socket]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
}

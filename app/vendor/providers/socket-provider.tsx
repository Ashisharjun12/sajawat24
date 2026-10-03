import type { ChatMessage } from '@/api/chat.api';
import { getSocketUrl } from '@/lib/socket-url';
import { patchReadStatus } from '@/module/chat/lib/chat-utils';
import {
  VENDOR_JOB_ASSIGNED_EVENT,
  VENDOR_JOB_UPDATED_EVENT,
} from '@/module/bookings/lib/vendor-jobs.events';
import { vendorJobsKeys } from '@/module/bookings/hooks/use-vendor-jobs';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

function attachVendorJobListeners(socket: Socket, queryClient: QueryClient) {
  const refreshJobs = (payload?: { orderId?: string }) => {
    void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    if (payload?.orderId) {
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.detail(payload.orderId) });
    }
  };

  socket.on(VENDOR_JOB_ASSIGNED_EVENT, () => refreshJobs());
  socket.on(VENDOR_JOB_UPDATED_EVENT, (payload: { orderId?: string }) => refreshJobs(payload));
}

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

    instance.on('chat:message', (payload: { conversationId?: string }) => {
      if (payload?.conversationId) {
        useChatStore.getState().onIncomingMessage(payload.conversationId);
        const activeId = useChatStore.getState().activeConversationId;
        if (activeId !== payload.conversationId) {
          void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    });

    instance.on(
      'chat:read',
      (payload: { conversationId?: string; readUpToSequence?: number }) => {
        if (!payload?.conversationId || !payload.readUpToSequence) return;
        queryClient.setQueryData<ChatMessage[]>(
          ['chat', 'messages', payload.conversationId],
          (old) => patchReadStatus(old, payload.readUpToSequence),
        );
      },
    );

    attachVendorJobListeners(instance, queryClient);

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

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

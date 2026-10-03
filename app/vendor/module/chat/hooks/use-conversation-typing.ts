import { useSocket } from '@/providers/socket-provider';
import { useEffect, useRef, useState } from 'react';

const TYPING_IDLE_MS = 3000;
const CHAT_TYPING_EVENT = 'chat:typing';

export function useConversationTyping(
  conversationId: string | undefined,
  draft: string,
  ownRole: 'vendor' | 'customer',
) {
  const { socket } = useSocket();
  const [otherTyping, setOtherTyping] = useState(false);
  const lastEmittedRef = useRef<boolean | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;

    function emitTyping(isTyping: boolean) {
      if (lastEmittedRef.current === isTyping) return;
      lastEmittedRef.current = isTyping;
      socket?.emit(CHAT_TYPING_EVENT, { conversationId, isTyping });
    }

    if (!draft.trim()) {
      emitTyping(false);
      return undefined;
    }

    emitTyping(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => emitTyping(false), TYPING_IDLE_MS);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [socket, conversationId, draft]);

  useEffect(() => {
    if (!conversationId) return undefined;

    function onTyping(payload: {
      conversationId?: string;
      isTyping?: boolean;
      role?: string;
    }) {
      if (payload.conversationId !== conversationId) return;
      if (payload.role === ownRole) return;

      setOtherTyping(Boolean(payload.isTyping));
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (payload.isTyping) {
        hideTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_IDLE_MS + 500);
      }
    }

    socket.on(CHAT_TYPING_EVENT, onTyping);
    return () => {
      socket.off(CHAT_TYPING_EVENT, onTyping);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [socket, conversationId, ownRole]);

  useEffect(() => {
    return () => {
      if (socket && conversationId && lastEmittedRef.current) {
        socket.emit(CHAT_TYPING_EVENT, { conversationId, isTyping: false });
      }
    };
  }, [socket, conversationId]);

  return { otherTyping };
}

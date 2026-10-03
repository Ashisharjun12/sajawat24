import { create } from 'zustand';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export type PendingMessage = {
  clientMessageId: string;
  conversationId: string;
  body: string;
  createdAt: string;
  attachmentUri?: string;
  messageType?: 'text' | 'image' | 'file';
};

type ChatState = {
  connectionStatus: ConnectionStatus;
  totalUnreadCount: number;
  activeConversationId: string | null;
  pendingMessages: Record<string, PendingMessage[]>;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setTotalUnreadCount: (count: number) => void;
  setActiveConversation: (id: string | null) => void;
  addPendingMessage: (conversationId: string, msg: PendingMessage) => void;
  resolvePendingMessage: (conversationId: string, clientMessageId: string) => void;
  onIncomingMessage: (conversationId: string) => void;
  reset: () => void;
};

const initialState = {
  connectionStatus: 'idle' as ConnectionStatus,
  totalUnreadCount: 0,
  activeConversationId: null as string | null,
  pendingMessages: {} as Record<string, PendingMessage[]>,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addPendingMessage: (conversationId, msg) =>
    set((state) => ({
      pendingMessages: {
        ...state.pendingMessages,
        [conversationId]: [...(state.pendingMessages[conversationId] ?? []), msg],
      },
    })),
  resolvePendingMessage: (conversationId, clientMessageId) =>
    set((state) => ({
      pendingMessages: {
        ...state.pendingMessages,
        [conversationId]: (state.pendingMessages[conversationId] ?? []).filter(
          (m) => m.clientMessageId !== clientMessageId,
        ),
      },
    })),
  onIncomingMessage: (conversationId) => {
    const { activeConversationId } = get();
    if (activeConversationId !== conversationId) {
      set((state) => ({ totalUnreadCount: state.totalUnreadCount + 1 }));
    }
  },
  reset: () => set(initialState),
}));

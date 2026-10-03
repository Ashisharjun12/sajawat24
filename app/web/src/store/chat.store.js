import { create } from "zustand"

const initialState = {
  connectionStatus: "idle",
  totalUnreadCount: 0,
  activeConversationId: null,
  pendingMessages: {},
}

/** @typedef {{ clientMessageId: string, conversationId: string, body: string, createdAt: string, attachmentUri?: string, messageType?: string }} PendingMessage */

export const useChatStore = create((set, get) => ({
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
    const { activeConversationId } = get()
    if (activeConversationId !== conversationId) {
      set((state) => ({ totalUnreadCount: state.totalUnreadCount + 1 }))
    }
  },
  reset: () => set(initialState),
}))

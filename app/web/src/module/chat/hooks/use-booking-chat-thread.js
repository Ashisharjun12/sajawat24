import { useCallback } from "react"
import { getBookingConversation } from "@/api/chat.api"
import { useChatThreadCore } from "@/module/chat/hooks/use-chat-thread-core"

export function useBookingChatThread(orderId, { enabled = true } = {}) {
  const resolveConversation = useCallback(
    () => getBookingConversation(orderId),
    [orderId],
  )

  return useChatThreadCore({
    enabled: Boolean(orderId) && enabled,
    resolveConversation,
    senderRole: "customer",
  })
}

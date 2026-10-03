import { useCallback } from "react"
import { createComplaint } from "@/api/chat.api"
import { useChatThreadCore } from "@/module/chat/hooks/use-chat-thread-core"

export function useComplaintChatThread(orderId) {
  const resolveConversation = useCallback(
    () => createComplaint({ orderId }),
    [orderId],
  )

  return useChatThreadCore({
    enabled: Boolean(orderId),
    resolveConversation,
    senderRole: "customer",
  })
}

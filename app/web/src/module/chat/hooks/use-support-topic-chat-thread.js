import { useCallback } from "react"
import { openCustomerSupport } from "@/api/chat.api"
import { useChatThreadCore } from "@/module/chat/hooks/use-chat-thread-core"

export function useSupportTopicChatThread(topicKey, subject) {
  const resolveConversation = useCallback(
    () => openCustomerSupport({ topicKey, subject }),
    [topicKey, subject],
  )

  return useChatThreadCore({
    enabled: Boolean(topicKey),
    resolveConversation,
    senderRole: "customer",
  })
}

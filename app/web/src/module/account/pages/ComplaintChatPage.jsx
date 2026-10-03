import { useParams } from "react-router-dom"
import { AccountChatPanel } from "@/module/chat/components/AccountChatPanel"
import { ChatThreadView } from "@/module/chat/components/ChatThreadView"
import { useComplaintChatThread } from "@/module/chat/hooks/use-complaint-chat-thread"

export function ComplaintChatPage() {
  const { orderId } = useParams()
  const thread = useComplaintChatThread(orderId)

  const subtitle = thread.conversation?.orderRef
    ? `Order ${thread.conversation.orderRef}`
    : "Our team will review your complaint"

  return (
    <AccountChatPanel
      backTo={`/account/bookings/${orderId}`}
      title="Complaint"
      subtitle={subtitle}
    >
      <ChatThreadView {...thread} ownRole="customer" placeholder="Describe your issue..." />
    </AccountChatPanel>
  )
}

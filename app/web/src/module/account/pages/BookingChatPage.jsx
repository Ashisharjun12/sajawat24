import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { getOrder } from "@/api/orders.api"
import { AccountChatPanel } from "@/module/chat/components/AccountChatPanel"
import { ChatThreadView } from "@/module/chat/components/ChatThreadView"
import { useBookingChatThread } from "@/module/chat/hooks/use-booking-chat-thread"
import { Spinner } from "@/components/ui/spinner"

const ENDED_ORDER_STATUSES = new Set(["COMPLETED", "CANCELLED"])

function BookingChatActive({ orderId }) {
  const thread = useBookingChatThread(orderId)
  const chatPeer = thread.conversation?.chatPeer
  const vendorParticipant = thread.conversation?.participants?.find((p) => p.role === "vendor")
  const title = chatPeer?.name || vendorParticipant?.name || "Decorator"
  const subtitle = thread.conversation?.orderRef
    ? `Order ${thread.conversation.orderRef}`
    : undefined

  return (
    <AccountChatPanel
      backTo={`/account/bookings/${orderId}`}
      title={title}
      subtitle={subtitle}
      peerOnline={vendorParticipant?.isOnline}
    >
      <ChatThreadView
        {...thread}
        ownRole="customer"
        placeholder="Message your decorator..."
        composerDisabled={false}
      />
    </AccountChatPanel>
  )
}

export function BookingChatPage() {
  const { orderId } = useParams()
  const [orderStatus, setOrderStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    setLoading(true)
    void getOrder(orderId)
      .then((order) => setOrderStatus(order.status))
      .catch(() => setOrderStatus(null))
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) {
    return <Navigate to="/account/bookings" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (orderStatus && ENDED_ORDER_STATUSES.has(orderStatus)) {
    return <Navigate to={`/account/bookings/${orderId}`} replace />
  }

  return <BookingChatActive orderId={orderId} />
}

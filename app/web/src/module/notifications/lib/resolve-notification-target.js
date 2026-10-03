export function resolveNotificationTarget(data = {}) {
  if (data.event === "CHAT_MESSAGE") {
    if (data.conversationType === "booking" && data.orderId) {
      return `/account/bookings/${data.orderId}`
    }
    if (data.conversationType === "complaint" && data.orderId) {
      return `/account/bookings/${data.orderId}/complaint`
    }
    if (data.conversationType === "customer_support" && data.topicKey) {
      return `/account/help/${data.topicKey}/chat`
    }
  }

  if (
    (data.event === "BOOKING_CONFIRMED" || data.event === "BOOKING_ASSIGNED") &&
    data.orderId
  ) {
    return `/account/bookings/${data.orderId}`
  }

  if (data.event === "BOOKING_CONFIRMED" && data.bookingId) {
    return `/account/bookings/${data.bookingId}`
  }

  return "/account/notifications"
}

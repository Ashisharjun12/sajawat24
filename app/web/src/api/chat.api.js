import { api, unwrap } from "@/api/api"

export async function getBookingConversation(orderId) {
  const res = await api.get(`/user/chat/orders/${orderId}/conversation`)
  return unwrap(res)
}

export async function openCustomerSupport({ topicKey = "general", subject } = {}) {
  const res = await api.post("/user/chat/support", { topicKey, subject })
  return unwrap(res)
}

export async function createComplaint({ orderId, subject, body }) {
  const res = await api.post("/user/chat/complaints", { orderId, subject, body })
  return unwrap(res)
}

export async function listConversations(params = {}) {
  const res = await api.get("/user/chat/conversations", { params })
  return unwrap(res)
}

export async function listMessages(conversationId, params = {}) {
  const res = await api.get(`/user/chat/conversations/${conversationId}/messages`, { params })
  return unwrap(res)
}

export async function sendMessage(conversationId, body) {
  const res = await api.post(`/user/chat/conversations/${conversationId}/messages`, body)
  return unwrap(res)
}

export async function markRead(conversationId, lastReadMessageId) {
  const res = await api.post(`/user/chat/conversations/${conversationId}/read`, {
    lastReadMessageId,
  })
  return unwrap(res)
}

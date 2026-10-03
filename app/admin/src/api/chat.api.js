import { api, unwrap } from "@/api/api"

export async function getUnreadCount() {
  const res = await api.get("/admin/chat/unread-count")
  return unwrap(res)
}

export async function listConversations(params = {}) {
  const res = await api.get("/admin/chat/conversations", { params })
  return unwrap(res)
}

export async function getConversation(id) {
  const res = await api.get(`/admin/chat/conversations/${id}`)
  return unwrap(res)
}

export async function listMessages(conversationId, params = {}) {
  const res = await api.get(`/admin/chat/conversations/${conversationId}/messages`, { params })
  return unwrap(res)
}

export async function sendMessage(conversationId, body) {
  const res = await api.post(`/admin/chat/conversations/${conversationId}/messages`, body)
  return unwrap(res)
}

export async function markRead(conversationId, lastReadMessageId) {
  const res = await api.post(`/admin/chat/conversations/${conversationId}/read`, {
    lastReadMessageId,
  })
  return unwrap(res)
}

export async function closeConversation(conversationId, resolutionNote) {
  const res = await api.post(`/admin/chat/conversations/${conversationId}/close`, {
    resolutionNote,
  })
  return unwrap(res)
}

export async function reopenConversation(conversationId) {
  const res = await api.post(`/admin/chat/conversations/${conversationId}/reopen`)
  return unwrap(res)
}

export async function assignConversation(conversationId) {
  const res = await api.post(`/admin/chat/conversations/${conversationId}/assign`)
  return unwrap(res)
}

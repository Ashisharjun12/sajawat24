import { api, unwrap } from "@/api/api"

export function presignChatAttachment(conversationId, input) {
  return api
    .post(`/admin/chat/conversations/${conversationId}/attachments/presign`, input)
    .then(unwrap)
}

export function completeChatAttachment(conversationId, uploadId) {
  return api
    .post(`/admin/chat/conversations/${conversationId}/attachments/${uploadId}/complete`)
    .then(unwrap)
}

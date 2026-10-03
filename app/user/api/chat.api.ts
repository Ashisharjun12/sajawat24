import { api, unwrap } from '@/api/client';

export type ChatMessage = {
  id: string;
  conversationId: string;
  sequence: number;
  senderUserId: string | null;
  senderRole: string;
  body: string | null;
  messageType: string;
  attachmentUrl: string | null;
  clientMessageId: string | null;
  createdAt: string;
  readStatus?: 'sent' | 'read';
};

export type ChatConversation = {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  contextType: string | null;
  contextId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  participants: Array<{ userId: string; role: string; name: string; isOnline?: boolean }>;
  orderRef?: string | null;
  chatPeer?: { name: string; role: string } | null;
};

export function getBookingConversation(orderId: string) {
  return api.get(`/user/chat/orders/${orderId}/conversation`).then(unwrap<ChatConversation>);
}

export function openCustomerSupport(params: { topicKey?: string; subject?: string } = {}) {
  const { topicKey = 'general', subject } = params;
  return api
    .post('/user/chat/support', { topicKey, subject })
    .then(unwrap<ChatConversation>);
}

export function listMessages(
  conversationId: string,
  params?: { afterSequence?: number; beforeSequence?: number; limit?: number },
) {
  return api
    .get(`/user/chat/conversations/${conversationId}/messages`, { params })
    .then(unwrap<ChatMessage[]>);
}

export type PresignChatAttachmentResult = {
  uploadId: string;
  uploadUrl: string;
  publicUrl: string;
};

export function presignChatAttachment(
  conversationId: string,
  input: { fileName: string; mimeType: string; kind: 'image' | 'file' },
) {
  return api
    .post(`/user/chat/conversations/${conversationId}/attachments/presign`, input)
    .then(unwrap<PresignChatAttachmentResult>);
}

export function completeChatAttachment(conversationId: string, uploadId: string) {
  return api
    .post(`/user/chat/conversations/${conversationId}/attachments/${uploadId}/complete`)
    .then(unwrap<PresignChatAttachmentResult>);
}

export function sendMessage(
  conversationId: string,
  body: {
    body?: string;
    clientMessageId?: string;
    uploadId?: string;
    messageType?: 'text' | 'image' | 'file';
  },
) {
  return api
    .post(`/user/chat/conversations/${conversationId}/messages`, body)
    .then(unwrap<ChatMessage>);
}

export function markConversationRead(conversationId: string, lastReadMessageId: string) {
  return api
    .post(`/user/chat/conversations/${conversationId}/read`, { lastReadMessageId })
    .then(unwrap<{ ok: boolean }>);
}

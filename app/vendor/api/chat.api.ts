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

export type Conversation = {
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
};

export type ConversationListResponse = {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
};

export async function listConversations(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get('/vendor/chat/conversations', { params });
  return unwrap<ConversationListResponse>(res);
}

export async function getBookingConversation(orderId: string) {
  const res = await api.get(`/vendor/chat/orders/${orderId}/conversation`);
  return unwrap<Conversation>(res);
}

export async function openVendorSupport() {
  const res = await api.post('/vendor/chat/conversations/support');
  return unwrap<Conversation>(res);
}

export async function listMessages(
  conversationId: string,
  params?: { afterSequence?: number; beforeSequence?: number; limit?: number },
) {
  const res = await api.get(`/vendor/chat/conversations/${conversationId}/messages`, { params });
  return unwrap<ChatMessage[]>(res);
}

export type PresignChatAttachmentResult = {
  uploadId: string;
  uploadUrl: string;
  publicUrl: string;
};

export async function presignChatAttachment(
  conversationId: string,
  input: { fileName: string; mimeType: string; kind: 'image' | 'file' },
) {
  const res = await api.post(
    `/vendor/chat/conversations/${conversationId}/attachments/presign`,
    input,
  );
  return unwrap<PresignChatAttachmentResult>(res);
}

export async function completeChatAttachment(conversationId: string, uploadId: string) {
  const res = await api.post(
    `/vendor/chat/conversations/${conversationId}/attachments/${uploadId}/complete`,
  );
  return unwrap<PresignChatAttachmentResult>(res);
}

export async function sendMessage(
  conversationId: string,
  body: {
    body?: string;
    clientMessageId?: string;
    uploadId?: string;
    messageType?: 'text' | 'image' | 'file';
  },
) {
  const res = await api.post(`/vendor/chat/conversations/${conversationId}/messages`, body);
  return unwrap<ChatMessage>(res);
}

export async function markRead(conversationId: string, lastReadMessageId: string) {
  const res = await api.post(`/vendor/chat/conversations/${conversationId}/read`, {
    lastReadMessageId,
  });
  return unwrap<{ ok: boolean }>(res);
}

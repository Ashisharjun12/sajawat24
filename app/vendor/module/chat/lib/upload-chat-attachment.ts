import * as chatApi from '@/api/chat.api';
import type { PickedChatAttachment } from '@/module/chat/lib/pick-chat-attachment';

async function putFile(uploadUrl: string, uri: string, contentType: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload attachment');
  }
}

export async function uploadChatAttachment(
  conversationId: string,
  asset: PickedChatAttachment,
): Promise<string> {
  const presign = await chatApi.presignChatAttachment(conversationId, {
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    kind: asset.kind,
  });

  await putFile(presign.uploadUrl, asset.uri, asset.mimeType);
  await chatApi.completeChatAttachment(conversationId, presign.uploadId);
  return presign.uploadId;
}

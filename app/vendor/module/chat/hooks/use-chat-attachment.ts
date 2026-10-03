import * as chatApi from '@/api/chat.api';
import {
  pickChatAttachment,
  type ChatAttachmentSource,
} from '@/module/chat/lib/pick-chat-attachment';
import { uploadChatAttachment } from '@/module/chat/lib/upload-chat-attachment';
import { useChatStore } from '@/store/chat.store';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

function newClientMessageId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChatAttachment(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const sendAttachment = useCallback(
    async (source: ChatAttachmentSource) => {
      const activeConversationId = conversationId;
      if (!activeConversationId || isUploading) return;

      const asset = await pickChatAttachment(source);
      if (!asset) return;

      const clientMessageId = newClientMessageId();
      const messageType = asset.kind === 'file' ? 'file' : 'image';

      useChatStore.getState().addPendingMessage(activeConversationId, {
        clientMessageId,
        conversationId: activeConversationId,
        body: asset.kind === 'file' ? asset.fileName : '',
        createdAt: new Date().toISOString(),
        attachmentUri: asset.uri,
        messageType,
      });

      setIsUploading(true);
      try {
        const uploadId = await uploadChatAttachment(activeConversationId, asset);
        await chatApi.sendMessage(activeConversationId, {
          body: asset.kind === 'file' ? asset.fileName : '',
          uploadId,
          messageType,
          clientMessageId,
        });
        useChatStore.getState().resolvePendingMessage(activeConversationId, clientMessageId);
        void queryClient.invalidateQueries({ queryKey: ['chat', 'messages', activeConversationId] });
      } catch (err) {
        useChatStore.getState().resolvePendingMessage(activeConversationId, clientMessageId);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [conversationId, isUploading, queryClient],
  );

  return { sendAttachment, isUploading };
}

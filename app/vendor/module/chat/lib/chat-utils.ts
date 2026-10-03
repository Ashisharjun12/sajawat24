import type { ChatMessage } from '@/api/chat.api';

export function formatMessageTime(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function patchReadStatus(
  messages: ChatMessage[] | undefined,
  readUpToSequence: number | undefined,
): ChatMessage[] {
  if (!messages || !readUpToSequence) return messages ?? [];
  return messages.map((msg) => {
    if (msg.messageType === 'system' || !msg.readStatus) return msg;
    if (msg.sequence <= readUpToSequence) {
      return { ...msg, readStatus: 'read' };
    }
    return msg;
  });
}

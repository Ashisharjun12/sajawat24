import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ChatMessage } from '@/api/chat.api';
import { Image } from 'expo-image';
import { FileText } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

type ChatAttachmentBubbleProps = {
  message: ChatMessage;
  /** True when bubble is on the customer's (outbound) side. */
  isMine: boolean;
};

export function ChatAttachmentBubble({ message, isMine }: ChatAttachmentBubbleProps) {
  const url = message.attachmentUrl;
  if (!url) return null;

  if (message.messageType === 'image') {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: 220, height: 160, borderRadius: 12 }}
        contentFit="cover"
      />
    );
  }

  const label = message.body || 'Document';
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      className={`flex-row items-center gap-2 rounded-btn px-3 py-2 ${isMine ? 'bg-primary' : 'bg-muted'}`}>
      <View className="rounded-pill bg-background/20 p-2">
        <Icon
          as={FileText}
          size={18}
          className={isMine ? 'text-primary-foreground' : 'text-foreground'}
        />
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}
        numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

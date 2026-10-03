import { Text } from '@/components/ui/text';
import type { ChatMessage } from '@/api/chat.api';
import { Image } from 'expo-image';
import { FileText } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

type ChatAttachmentBubbleProps = {
  message: ChatMessage;
  isVendor: boolean;
};

export function ChatAttachmentBubble({ message, isVendor }: ChatAttachmentBubbleProps) {
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
      className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${isVendor ? 'bg-primary/90' : 'bg-muted'}`}>
      <View className="rounded-full bg-background/20 p-2">
        <FileText size={18} color={isVendor ? '#FFFFFF' : '#111827'} />
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${isVendor ? 'text-primary-foreground' : 'text-foreground'}`}
        numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

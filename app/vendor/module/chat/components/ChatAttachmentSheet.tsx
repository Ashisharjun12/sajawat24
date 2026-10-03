import { PressableScale } from '@/components/motion';
import { Text } from '@/components/ui/text';
import type { ChatAttachmentSource } from '@/module/chat/lib/pick-chat-attachment';
import { Camera, File, Image as ImageIcon, X } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatAttachmentSheetProps = {
  open: boolean;
  onClose: () => void;
  onPick: (source: ChatAttachmentSource) => void;
  disabled?: boolean;
};

const OPTIONS: Array<{
  id: ChatAttachmentSource;
  label: string;
  icon: typeof Camera;
  hint: string;
}> = [
  { id: 'camera', label: 'Camera', icon: Camera, hint: 'Take a photo' },
  { id: 'image', label: 'Image', icon: ImageIcon, hint: 'Choose from gallery' },
  { id: 'file', label: 'File', icon: File, hint: 'Upload a PDF or image' },
];

export function ChatAttachmentSheet({
  open,
  onClose,
  onPick,
  disabled = false,
}: ChatAttachmentSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        className="rounded-t-3xl border-t border-border bg-background px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-semibold">Attach</Text>
          <Pressable onPress={onClose} className="rounded-full border border-border bg-background p-2">
            <X size={18} color="#111827" />
          </Pressable>
        </View>

        <View className="gap-3 pb-2">
          {OPTIONS.map((option) => (
            <PressableScale
              key={option.id}
              disabled={disabled}
              onPress={() => {
                onClose();
                onPick(option.id);
              }}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4">
              <View className="size-11 items-center justify-center rounded-full border border-border bg-muted/30">
                <option.icon size={20} color="#111827" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-base font-semibold">{option.label}</Text>
                <Text className="text-muted-foreground mt-0.5 text-xs">{option.hint}</Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </View>
    </Modal>
  );
}

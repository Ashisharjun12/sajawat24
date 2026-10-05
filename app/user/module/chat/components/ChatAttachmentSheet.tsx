import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ChatAttachmentSource } from '@/module/chat/lib/pick-chat-attachment';
import { BottomSheetHandle } from '@/module/home/components/HomeBottomSheetModal';
import { Camera, File, Image as ImageIcon } from 'lucide-react-native';
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
      <Pressable
        className="flex-1 bg-scrim/55 dark:bg-scrim/65"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View
        className="rounded-t-sheet bg-surface px-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <BottomSheetHandle />
        <Text className="text-h2 font-semibold mb-4">Attach</Text>

        <View className="gap-3 pb-2">
          {OPTIONS.map((option) => (
            <ScalePressable
              key={option.id}
              disabled={disabled}
              onPress={() => {
                onClose();
                onPick(option.id);
              }}
              className="flex-row items-center gap-3 rounded-card border border-border bg-surface px-4 py-4">
              <View className="size-11 items-center justify-center rounded-pill bg-primary-tint">
                <Icon as={option.icon} size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-body font-medium">{option.label}</Text>
                <Text className="text-muted-foreground mt-0.5 text-caption">{option.hint}</Text>
              </View>
            </ScalePressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

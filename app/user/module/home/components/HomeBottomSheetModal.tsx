import { Icon } from '@/components/ui/icon';
import { ScalePressable } from '@/components/shell';
import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeBottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  closeAccessibilityLabel?: string;
  /** Minimum height of the sheet panel (e.g. tall addon picker). */
  sheetMinHeight?: number;
};

export function HomeBottomSheetModal({
  visible,
  onClose,
  children,
  closeAccessibilityLabel = 'Close',
  sheetMinHeight,
}: HomeBottomSheetModalProps) {
  const keyboardInset = useKeyboardInset(visible);
  const safeInsets = useSafeAreaInsets();
  const sheetBottom = keyboardInset > 0 ? keyboardInset : safeInsets.bottom;

  function close() {
    Keyboard.dismiss();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={close}>
      <View className="flex-1">
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
          onPress={close}
          accessibilityRole="button">
          <View className="flex-1 bg-black/40" />
        </Pressable>
        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: sheetBottom, zIndex: 2, elevation: 8 }}
          pointerEvents="box-none">
          <ScalePressable
            onPress={close}
            haptic
            hitSlop={12}
            className="mb-3 rounded-full bg-background p-2.5 shadow-md"
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}>
            <Icon as={X} className="text-foreground size-5" />
          </ScalePressable>
          <View
            className="w-full rounded-t-3xl bg-background pb-4"
            pointerEvents="auto"
            style={sheetMinHeight != null ? { minHeight: sheetMinHeight } : undefined}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

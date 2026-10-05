import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import type { ReactNode } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WindowOverlay = Platform.OS === 'ios' ? FullWindowOverlay : View;

type HomeBottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  closeAccessibilityLabel?: string;
  /** Minimum height of the sheet panel (e.g. tall addon picker). */
  sheetMinHeight?: number;
  /** Maximum height of the sheet panel (content-sized up to this cap). */
  sheetMaxHeight?: number;
};

/** Brand sheet chrome: 24 top corners, 40x4 handle, token scrim that closes on tap. */
export function BottomSheetHandle() {
  return (
    <View className="items-center pb-2 pt-3">
      <View className="h-1 w-10 rounded-pill bg-border" />
    </View>
  );
}

export function HomeBottomSheetModal({
  visible,
  onClose,
  children,
  closeAccessibilityLabel = 'Close',
  sheetMinHeight,
  sheetMaxHeight,
}: HomeBottomSheetModalProps) {
  const keyboardInset = useKeyboardInset(visible);
  const safeInsets = useSafeAreaInsets();
  const sheetBottom = keyboardInset > 0 ? keyboardInset : safeInsets.bottom;
  const sizedSheet = sheetMinHeight != null && sheetMaxHeight != null;

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
      presentationStyle="overFullScreen"
      onRequestClose={close}>
      <WindowOverlay style={styles.windowOverlay}>
        <View className="flex-1" style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}>
            <View className="flex-1 bg-scrim/70 dark:bg-scrim/75" />
          </Pressable>
          <View
            className="absolute left-0 right-0"
            style={{ bottom: 0, zIndex: 2, elevation: 32 }}
            pointerEvents="box-none">
            <View
              className="w-full overflow-hidden rounded-t-sheet bg-surface"
              pointerEvents="auto"
              style={[
                { paddingBottom: sheetBottom + 16 },
              sizedSheet
                ? {
                    height: sheetMinHeight,
                    minHeight: sheetMinHeight,
                    maxHeight: sheetMaxHeight,
                    flexDirection: 'column' as const,
                  }
                : undefined,
              !sizedSheet && sheetMinHeight != null ? { minHeight: sheetMinHeight } : undefined,
              !sizedSheet && sheetMaxHeight != null ? { maxHeight: sheetMaxHeight } : undefined,
            ]}>
            <BottomSheetHandle />
            {sizedSheet ? (
              <View className="min-h-0 flex-1">{children}</View>
            ) : (
              children
            )}
          </View>
          </View>
        </View>
      </WindowOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  windowOverlay: {
    flex: 1,
    ...(Platform.OS === 'android' ? { elevation: 32 } : null),
  },
  modalRoot: {
    flex: 1,
    zIndex: 9999,
    elevation: 32,
  },
});

import { SwipeToAcceptButton } from '@/module/bookings/components/SwipeToConfirmButton';
import { Text } from '@/components/ui/text';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  loading?: boolean;
  isReassign: boolean;
  onClose: () => void;
  onConfirmSelfAssign: () => void;
};

export function SelfAssignConfirmSheet({
  open,
  loading = false,
  isReassign,
  onClose,
  onConfirmSelfAssign,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/45"
            onPress={loading ? undefined : onClose}
          />
          <View
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}>
            <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <Text className="text-foreground text-center text-xl font-semibold">Assign yourself</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
              {isReassign
                ? 'This replaces the current worker on the job.'
                : 'You’ll handle chat and delivery steps. The job appears in worker mode.'}
            </Text>

            <View className="mt-6">
              {open ? (
                <SwipeToAcceptButton
                  key="self-assign-swipe"
                  label="Swipe to confirm"
                  loadingLabel="Assigning…"
                  loading={loading}
                  disabled={loading}
                  onAccept={onConfirmSelfAssign}
                />
              ) : null}
            </View>

            <Pressable className="mt-4 py-2" disabled={loading} onPress={onClose}>
              <Text className="text-center text-sm font-medium text-muted-foreground">Back</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

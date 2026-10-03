import type { TeamMember } from '@/api/team.api';
import { SwipeToAcceptButton } from '@/module/bookings/components/SwipeToConfirmButton';
import { Text } from '@/components/ui/text';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  worker: TeamMember | null;
  loading?: boolean;
  onClose: () => void;
  onConfirmAssign: () => void;
  onUnassign?: () => void;
  isReassign: boolean;
};

export function AssignWorkerConfirmSheet({
  open,
  worker,
  loading = false,
  onClose,
  onConfirmAssign,
  onUnassign,
  isReassign,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);

  if (!open || !worker) return null;

  const phone = formatIndiaPhoneDisplay(worker.phone) || worker.phone;

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
            <Text className="text-foreground text-center text-xl font-semibold">
              {isReassign ? 'Reassign job?' : 'Assign job?'}
            </Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
              Customer chat will go to this worker for this booking.
            </Text>

            <View className="mt-5 rounded-2xl border border-border bg-muted/40 px-4 py-4">
              <Text className="text-foreground text-lg font-semibold">{worker.displayName}</Text>
              <Text className="text-muted-foreground mt-1 text-sm">{phone}</Text>
            </View>

            <View className="mt-6">
              <SwipeToAcceptButton
                label="Swipe to assign worker"
                loadingLabel="Assigning…"
                loading={loading}
                disabled={loading}
                onAccept={onConfirmAssign}
              />
            </View>

            {onUnassign ? (
              <Pressable className="mt-4 py-3" disabled={loading} onPress={onUnassign}>
                <Text className="text-center text-sm font-medium text-destructive">
                  Remove assignment
                </Text>
              </Pressable>
            ) : null}

            <Pressable className="mt-2 py-2" disabled={loading} onPress={onClose}>
              <Text className="text-center text-sm font-medium text-muted-foreground">Back</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

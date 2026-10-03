import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SwipeToConfirmButton } from '@/module/bookings/components/SwipeToConfirmButton';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DeclineBookingSheetProps = {
  open: boolean;
  onClose: () => void;
  bookingLabel?: string;
  onDecline: () => void;
  loading?: boolean;
  error?: string | null;
};

export function DeclineBookingSheet({
  open,
  onClose,
  bookingLabel,
  onDecline,
  loading = false,
  error,
}: DeclineBookingSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
          <View
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}>
            <Text className="text-foreground text-lg font-semibold">Decline this booking?</Text>
            {bookingLabel ? (
              <Text className="text-foreground mt-2 text-base font-medium">{bookingLabel}</Text>
            ) : null}
            <Text className="text-muted-foreground mt-2 text-sm leading-5">
              We&apos;ll assign another decorator for this booking. This can&apos;t be undone.
            </Text>

            <View className="mt-5 gap-3">
              {open ? (
                <SwipeToConfirmButton
                  key="decline-swipe"
                  variant="decline"
                  label="Swipe to decline booking"
                  loading={loading}
                  disabled={loading}
                  onConfirm={onDecline}
                />
              ) : null}
              {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
              <Button className="h-11 rounded-full" variant="ghost" disabled={loading} onPress={onClose}>
                <Text className="font-medium">Keep booking</Text>
              </Button>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

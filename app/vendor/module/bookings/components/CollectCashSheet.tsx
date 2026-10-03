import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { SwipeToConfirmButton } from '@/module/bookings/components/SwipeToConfirmButton';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CollectCashSheetProps = {
  open: boolean;
  onClose: () => void;
  amountPaise: number;
  onCollect: () => void;
  loading?: boolean;
  error?: string | null;
};

export function CollectCashSheet({
  open,
  onClose,
  amountPaise,
  onCollect,
  loading = false,
  error,
}: CollectCashSheetProps) {
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
            <Text className="text-foreground text-lg font-semibold">Cash collected?</Text>
            <Text className="text-muted-foreground mt-2 text-sm leading-5">
              Confirm you received {formatInr(amountPaise)} in cash from the customer before
              sending the delivery code.
            </Text>

            <View className="mt-5 gap-3">
              {open ? (
                <SwipeToConfirmButton
                  key="collect-cash-swipe"
                  variant="accept"
                  label="Swipe — Cash collected"
                  loadingLabel="Saving…"
                  loading={loading}
                  disabled={loading}
                  onConfirm={onCollect}
                />
              ) : null}
              {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
              <Button
                className="h-11 rounded-full"
                variant="ghost"
                disabled={loading}
                onPress={onClose}>
                <Text className="font-medium">Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

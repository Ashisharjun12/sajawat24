import { PressableScale } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  formatWalletActivityDateLabel,
  startOfToday,
  subtractDays,
} from '@/module/payouts/lib/wallet-activity-date';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WalletActivityCustomDateSheetProps = {
  open: boolean;
  initialFrom: Date | null;
  initialTo: Date | null;
  onClose: () => void;
  onApply: (from: Date, to: Date) => void;
};

type PickerField = 'from' | 'to';

export function WalletActivityCustomDateSheet({
  open,
  initialFrom,
  initialTo,
  onClose,
  onApply,
}: WalletActivityCustomDateSheetProps) {
  const insets = useSafeAreaInsets();
  const [fromDate, setFromDate] = useState(() => initialFrom ?? subtractDays(startOfToday(), 29));
  const [toDate, setToDate] = useState(() => initialTo ?? startOfToday());
  const [pickerField, setPickerField] = useState<PickerField | null>(null);

  useEffect(() => {
    if (!open) {
      setPickerField(null);
      return;
    }
    const today = startOfToday();
    setFromDate(initialFrom ?? subtractDays(today, 29));
    setToDate(initialTo ?? today);
  }, [open, initialFrom, initialTo]);

  function onPickerChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed' || !date) {
      setPickerField(null);
      return;
    }

    if (pickerField === 'from') {
      setFromDate(date);
      if (date > toDate) setToDate(date);
    } else {
      setToDate(date);
      if (date < fromDate) setFromDate(date);
    }

    if (Platform.OS === 'android') {
      setPickerField(null);
    }
  }

  function handleApply() {
    onApply(fromDate, toDate);
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} />
        <View
          className="rounded-t-3xl bg-background px-5 pt-6"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Text className="text-foreground text-xl font-semibold">Custom date range</Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            Filter wallet activity by start and end date.
          </Text>

          <View className="mt-5 gap-3">
            <PressableScale onPress={() => setPickerField('from')} scaleTo={0.98}>
              <View className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
                <Text className="text-muted-foreground text-xs uppercase tracking-wide">From</Text>
                <Text className="text-foreground mt-1 text-base font-medium">
                  {formatWalletActivityDateLabel(fromDate)}
                </Text>
              </View>
            </PressableScale>

            <PressableScale onPress={() => setPickerField('to')} scaleTo={0.98}>
              <View className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
                <Text className="text-muted-foreground text-xs uppercase tracking-wide">To</Text>
                <Text className="text-foreground mt-1 text-base font-medium">
                  {formatWalletActivityDateLabel(toDate)}
                </Text>
              </View>
            </PressableScale>
          </View>

          {pickerField ? (
            <View className="mt-4 overflow-hidden rounded-2xl border border-border/60">
              <DateTimePicker
                value={pickerField === 'from' ? fromDate : toDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={startOfToday()}
                onChange={onPickerChange}
              />
            </View>
          ) : null}

          <View className="mt-5 gap-3">
            <Button className="h-12 rounded-full" onPress={handleApply}>
              <Text className="font-semibold">Apply range</Text>
            </Button>
            <Button className="h-11 rounded-full" variant="ghost" onPress={onClose}>
              <Text className="font-medium">Cancel</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

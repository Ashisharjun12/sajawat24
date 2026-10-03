import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays, format, startOfDay, startOfToday } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

const MAX_SCHEDULE_DAYS = 60;

type ProductDeliveryScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  onConfirm: (date: Date) => void;
};

export function ProductDeliveryScheduleDialog({
  open,
  onOpenChange,
  initialDate,
  onConfirm,
}: ProductDeliveryScheduleDialogProps) {
  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => addDays(today, MAX_SCHEDULE_DAYS), [today]);

  const [draftDate, setDraftDate] = useState(initialDate);
  const [androidDatePickerVisible, setAndroidDatePickerVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftDate(initialDate);
    setAndroidDatePickerVisible(Platform.OS === 'android');
  }, [open, initialDate]);

  function commitDate(date: Date) {
    onConfirm(startOfDay(date));
    onOpenChange(false);
  }

  function onIosDateChange(_event: DateTimePickerEvent, date?: Date) {
    if (!date) return;
    setDraftDate(date);
  }

  function onAndroidDateChange(event: DateTimePickerEvent, date?: Date) {
    setAndroidDatePickerVisible(false);
    if (event.type === 'set' && date) {
      commitDate(date);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-3 p-4 pt-10">
        <DialogHeader>
          <DialogTitle>Choose delivery date</DialogTitle>
          <DialogDescription>Pick when we should arrive to set up.</DialogDescription>
        </DialogHeader>

        {Platform.OS === 'ios' ? (
          <View className="items-center">
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="inline"
              minimumDate={today}
              maximumDate={maxDate}
              onChange={onIosDateChange}
            />
          </View>
        ) : (
          <View className="gap-3">
            <View className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <Text className="text-muted-foreground text-xs font-medium uppercase">Selected date</Text>
              <Text className="text-foreground mt-1 text-base font-semibold">
                {format(draftDate, 'EEEE, d MMMM yyyy')}
              </Text>
            </View>
            {!androidDatePickerVisible ? (
              <Button variant="outline" onPress={() => setAndroidDatePickerVisible(true)}>
                <Text>Pick a different date</Text>
              </Button>
            ) : null}
            {androidDatePickerVisible ? (
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="default"
                minimumDate={today}
                maximumDate={maxDate}
                onChange={onAndroidDateChange}
              />
            ) : null}
          </View>
        )}

        {Platform.OS === 'ios' ? (
          <DialogFooter className="flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1" onPress={() => onOpenChange(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button className="flex-1" onPress={() => commitDate(draftDate)}>
              <Text>Done</Text>
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

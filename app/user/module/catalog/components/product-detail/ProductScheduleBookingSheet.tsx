import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { buildScheduledIso, TIME_SLOTS } from '@/module/catalog/lib/time-slots';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { addDays, format, isSameDay, startOfToday } from 'date-fns';
import { Image } from 'expo-image';
import { CalendarDays, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, View } from 'react-native';
import { ProductDeliveryScheduleDialog } from './ProductDeliveryScheduleDialog';

type ProductScheduleBookingSheetProps = {
  visible: boolean;
  submitting: boolean;
  title: string;
  imageUrl?: string;
  onClose: () => void;
  onContinue: (scheduledIso: string) => void;
};

/** Quick-pick chips: today + next N−1 days; anything after opens calendar. */
const QUICK_DATE_COUNT = 5;

function dateChipPrimaryLabel(date: Date, today: Date): string {
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
  return format(date, 'EEE');
}

function isWithinQuickRange(date: Date, today: Date): boolean {
  for (let i = 0; i < QUICK_DATE_COUNT; i++) {
    if (isSameDay(date, addDays(today, i))) return true;
  }
  return false;
}

const THUMB_SIZE = 64;

export function ProductScheduleBookingSheet({
  visible,
  submitting,
  title,
  imageUrl,
  onClose,
  onContinue,
}: ProductScheduleBookingSheetProps) {
  const today = useMemo(() => startOfToday(), []);
  const quickDates = useMemo(
    () => Array.from({ length: QUICK_DATE_COUNT }, (_, i) => addDays(today, i)),
    [today],
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [slotId, setSlotId] = useState<string>('3-6');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const laterSelected = !isWithinQuickRange(selectedDate, today);

  const windowHeight = Dimensions.get('window').height;
  const sheetMinHeight = Math.round(windowHeight * 0.52);
  const sheetMaxHeight = Math.round(windowHeight * 0.78);

  function handleContinue() {
    onContinue(buildScheduledIso(selectedDate, slotId));
  }

  function openLaterCalendar() {
    setCalendarOpen(true);
  }

  function onCalendarConfirm(date: Date) {
    setSelectedDate(date);
    setCalendarOpen(false);
  }

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetMinHeight={sheetMinHeight}
      sheetMaxHeight={sheetMaxHeight}
      closeAccessibilityLabel="Close schedule picker">
      <View className="min-h-0 flex-1">
        <View className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-1">
          <Text className="text-foreground min-w-0 flex-1 text-lg font-semibold">
            Pick date & time slot
          </Text>
          <ScalePressable
            haptic
            onPress={onClose}
            className="size-9 items-center justify-center rounded-full bg-muted/60"
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Icon as={X} className="size-5 text-foreground" />
          </ScalePressable>
        </View>

        <ScrollView
          className="min-h-0 flex-1"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-5 pb-4">
          <View className="flex-row items-center gap-3 rounded-2xl bg-primary-tint px-3 py-3">
            <View
              className="shrink-0 overflow-hidden rounded-xl bg-muted"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                  contentFit="cover"
                  accessibilityLabel={title}
                />
              ) : null}
            </View>
            <Text className="text-foreground min-w-0 flex-1 text-base font-semibold" numberOfLines={3}>
              {title}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-muted-foreground text-sm font-medium">Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={Platform.OS === 'android'}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-2 pr-1">
              {quickDates.map((date) => {
                const selected = !laterSelected && isSameDay(date, selectedDate);
                return (
                  <ScalePressable
                    key={date.toISOString()}
                    haptic
                    onPress={() => setSelectedDate(date)}
                    className={cn(
                      'min-w-[72px] items-center rounded-xl border px-3 py-2.5',
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card active:bg-muted/40',
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        selected ? 'text-primary-foreground' : 'text-muted-foreground',
                      )}>
                      {dateChipPrimaryLabel(date, today)}
                    </Text>
                    <Text
                      className={cn(
                        'text-lg font-bold tabular-nums',
                        selected ? 'text-primary-foreground' : 'text-foreground',
                      )}>
                      {format(date, 'd')}
                    </Text>
                  </ScalePressable>
                );
              })}
              <ScalePressable
                haptic
                onPress={openLaterCalendar}
                className={cn(
                  'min-w-[72px] items-center rounded-xl border px-3 py-2.5',
                  laterSelected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-card active:bg-muted/40',
                )}
                accessibilityRole="button"
                accessibilityState={{ selected: laterSelected }}
                accessibilityLabel="Pick a later date">
                <Icon
                  as={CalendarDays}
                  className={cn(
                    'mb-0.5 size-4',
                    laterSelected ? 'text-primary-foreground' : 'text-primary',
                  )}
                />
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    laterSelected ? 'text-primary-foreground' : 'text-foreground',
                  )}>
                  Later
                </Text>
                <Text
                  className={cn(
                    'text-[10px] tabular-nums',
                    laterSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                  )}>
                  {laterSelected ? format(selectedDate, 'd MMM') : 'Pick'}
                </Text>
              </ScalePressable>
            </ScrollView>
            {laterSelected ? (
              <View className="flex-row flex-wrap items-center gap-1">
                <Text className="text-muted-foreground text-xs">
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </Text>
                <ScalePressable haptic onPress={openLaterCalendar} accessibilityRole="button">
                  <Text className="text-primary text-xs font-semibold">Change</Text>
                </ScalePressable>
              </View>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="text-muted-foreground text-sm font-medium">Time slot</Text>
            <View className="flex-row flex-wrap gap-2">
              {TIME_SLOTS.map((item) => {
                const selected = slotId === item.id;
                return (
                  <ScalePressable
                    key={item.id}
                    haptic
                    onPress={() => setSlotId(item.id)}
                    className={cn(
                      'rounded-full border px-4 py-2.5',
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card active:bg-muted/40',
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Text
                      className={cn(
                        'text-center text-xs font-semibold',
                        selected ? 'text-primary-foreground' : 'text-foreground',
                      )}>
                      {item.label}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-border/60 px-5 pt-3">
          <Button variant="cta" loading={submitting} onPress={handleContinue}>
            <Text>Continue to checkout</Text>
          </Button>
        </View>
      </View>

      <ProductDeliveryScheduleDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        initialDate={laterSelected ? selectedDate : addDays(today, QUICK_DATE_COUNT)}
        onConfirm={onCalendarConfirm}
      />
    </HomeBottomSheetModal>
  );
}

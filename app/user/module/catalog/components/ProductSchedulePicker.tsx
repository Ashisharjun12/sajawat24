import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TIME_SLOTS, slotLabelFor } from '@/module/catalog/lib/time-slots';
import { cn } from '@/lib/utils';
import { addDays, format, isSameDay, startOfToday } from 'date-fns';
import { CalendarCheck2, Check, Clock, Flame } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type ProductSchedulePickerProps = {
  onConfirm: (iso: string | null) => void;
};

export function ProductSchedulePicker({ onConfirm }: ProductSchedulePickerProps) {
  const today = useMemo(() => startOfToday(), []);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slot, setSlot] = useState<string>('9-12');
  const [confirmed, setConfirmed] = useState(false);

  function commit() {
    const scheduled = new Date(selectedDate);
    const hour =
      slot === '9-12' ? 9 : slot === '12-3' ? 12 : slot === '3-6' ? 15 : slot === '6-9' ? 18 : 21;
    scheduled.setHours(hour, 0, 0, 0);
    onConfirm(scheduled.toISOString());
    setConfirmed(true);
  }

  function reopen() {
    setConfirmed(false);
    onConfirm(null);
  }

  const slotLabel = slotLabelFor(slot);
  const dateSummary = format(selectedDate, 'EEEE, d MMMM yyyy');

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-emerald-600/15">
          <Icon as={CalendarCheck2} className="size-4 text-emerald-600" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-base font-semibold">Choose date & time</Text>
          <Text className="text-muted-foreground text-sm">When should we arrive to set up?</Text>
        </View>
        {confirmed ? (
          <Text className="text-sm font-semibold text-emerald-600">Set</Text>
        ) : null}
      </View>

      {confirmed ? (
        <View className="flex-row items-center gap-3 rounded-2xl bg-emerald-600/10 px-3 py-3">
          <View className="size-8 items-center justify-center rounded-full bg-emerald-600">
            <Icon as={Check} className="size-4 text-white" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-emerald-800">
              {slotLabel} · {dateSummary}
            </Text>
          </View>
          <Pressable onPress={reopen} accessibilityRole="button">
            <Text className="text-sm font-semibold text-foreground">Change</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View>
            <Text className="text-muted-foreground mb-2 text-xs font-medium uppercase">Select date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {dates.map((date) => {
                const selected = isSameDay(date, selectedDate);
                return (
                  <Pressable
                    key={date.toISOString()}
                    onPress={() => setSelectedDate(date)}
                    className={cn(
                      'min-w-14 items-center rounded-2xl border px-2 py-2',
                      selected ? 'border-primary bg-primary' : 'border-border bg-background'
                    )}
                    accessibilityRole="button">
                    <Text
                      className={cn(
                        'text-xs uppercase',
                        selected ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                      {format(date, 'EEE')}
                    </Text>
                    <Text
                      className={cn(
                        'text-base font-medium',
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                      {format(date, 'd')}
                    </Text>
                    <Text
                      className={cn(
                        'text-xs',
                        selected ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                      {format(date, 'MMM')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground text-xs font-medium uppercase">Select time</Text>
              <View className="flex-row items-center gap-1">
                <Icon as={Clock} className="text-muted-foreground size-3.5" />
                <Text className="text-muted-foreground text-xs">3-hr window</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {TIME_SLOTS.map((item) => {
                const selected = slot === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSlot(item.id)}
                    className={cn(
                      'min-w-[30%] flex-1 items-center rounded-2xl border px-1 py-2',
                      selected ? 'border-primary bg-primary' : 'border-border bg-background'
                    )}
                    accessibilityRole="button">
                    <Text
                      className={cn(
                        'text-center text-[11px] font-semibold',
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                      {item.label}
                    </Text>
                    {'fillingFast' in item && item.fillingFast ? (
                      <View
                        className={cn(
                          'mt-1 flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5',
                          selected ? 'bg-white/20' : 'bg-rose-600'
                        )}>
                        <Icon as={Flame} className={cn('size-2.5', selected ? 'text-primary-foreground' : 'text-white')} />
                        <Text
                          className={cn(
                            'text-[8px] font-bold uppercase',
                            selected ? 'text-primary-foreground' : 'text-white'
                          )}>
                          Fast
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button onPress={commit}>
            <Text>Done</Text>
          </Button>
        </>
      )}
    </View>
  );
}

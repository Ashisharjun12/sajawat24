import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { cn } from '@/lib/utils';
import { addDays, format, startOfToday } from 'date-fns';
import { CalendarDays } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

export type DeliveryDateMode = 'today' | 'tomorrow' | 'later';

type ProductDeliveryDateChipsProps = {
  mode: DeliveryDateMode | null;
  selectedDate: Date;
  onSelectMode: (mode: DeliveryDateMode) => void;
  onOpenLater: () => void;
};

export function ProductDeliveryDateChips({
  mode,
  selectedDate,
  onSelectMode,
  onOpenLater,
}: ProductDeliveryDateChipsProps) {
  const today = useMemo(() => startOfToday(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className="size-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
          <Icon as={CalendarDays} className="size-3.5 text-sky-600 dark:text-sky-400" />
        </View>
        <Text className="text-foreground text-xs font-semibold">Delivery date</Text>
      </View>
      <View className="flex-row gap-1.5">
        <DateChip
          label="Today"
          sub={format(today, 'd MMM')}
          selected={mode === 'today'}
          onPress={() => onSelectMode('today')}
        />
        <DateChip
          label="Tomorrow"
          sub={format(tomorrow, 'd MMM')}
          selected={mode === 'tomorrow'}
          onPress={() => onSelectMode('tomorrow')}
        />
        <DateChip
          label="Later"
          sub={mode === 'later' ? format(selectedDate, 'd MMM') : 'Pick'}
          selected={mode === 'later'}
          icon
          onPress={onOpenLater}
        />
      </View>
    </View>
  );
}

function DateChip({
  label,
  sub,
  selected,
  onPress,
  icon,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  icon?: boolean;
}) {
  return (
    <ScalePressable
      haptic
      onPress={onPress}
      className={cn(
        'min-h-[52px] flex-1 items-center justify-center rounded-xl border px-1 py-2',
        selected
          ? 'border-primary/50 bg-primary/15'
          : 'border-border bg-background active:bg-muted/30',
      )}
      accessibilityRole="button">
      {icon ? (
        <Icon
          as={CalendarDays}
          className={cn(
            'mb-0.5 size-3.5',
            selected ? 'text-primary' : 'text-sky-600 dark:text-sky-400',
          )}
        />
      ) : null}
      <Text className="text-foreground text-xs font-semibold">{label}</Text>
      <Text className={cn('text-[10px]', selected ? 'text-foreground/70' : 'text-muted-foreground')}>
        {sub}
      </Text>
    </ScalePressable>
  );
}

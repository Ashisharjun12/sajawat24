import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { TIME_SLOTS } from '@/module/catalog/lib/time-slots';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react-native';
import { View } from 'react-native';

type ProductDeliverySlotPickerProps = {
  slotId: string;
  onSlotChange: (slotId: string) => void;
};

export function ProductDeliverySlotPicker({ slotId, onSlotChange }: ProductDeliverySlotPickerProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className="size-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
          <Icon as={Clock} className="size-3.5 text-amber-700 dark:text-amber-400" />
        </View>
        <Text className="text-foreground text-xs font-semibold">Time slot</Text>
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {TIME_SLOTS.map((item) => {
          const selected = slotId === item.id;
          return (
            <ScalePressable
              key={item.id}
              haptic
              onPress={() => onSlotChange(item.id)}
              className={cn(
                'min-w-[30%] flex-1 items-center rounded-lg border px-1 py-2',
                selected
                  ? 'border-primary bg-primary'
                  : 'border-border bg-background active:bg-primary/5',
              )}
              accessibilityRole="button">
              <Text
                className={cn(
                  'text-center text-[10px] font-semibold leading-tight',
                  selected ? 'text-primary-foreground' : 'text-muted-foreground',
                )}>
                {item.label}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );
}

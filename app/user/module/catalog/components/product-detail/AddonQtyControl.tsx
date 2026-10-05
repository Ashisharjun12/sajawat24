import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';

type AddonQtyControlProps = {
  qty: number;
  max: number;
  available?: boolean;
  compact?: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function AddonQtyControl({
  qty,
  max,
  available = true,
  compact = false,
  onAdd,
  onIncrement,
  onDecrement,
}: AddonQtyControlProps) {
  const stepperBtn = compact ? 'size-7' : 'size-7';
  const iconSize = compact ? 'size-3.5' : 'size-3.5';
  const atMax = qty >= max;

  if (!available) {
    return <Text className="text-muted-foreground text-[11px]">Unavailable</Text>;
  }

  if (qty > 0) {
    return (
      <View
        className={cn(
          'flex-row items-center justify-between rounded-md border border-primary/35 bg-primary-tint px-0.5 py-0.5',
          compact ? 'min-w-[88px]' : 'w-full',
        )}>
        <ScalePressable
          haptic
          onPress={onDecrement}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          className={`${stepperBtn} items-center justify-center`}>
          <Icon as={Minus} className={`${iconSize} text-primary`} strokeWidth={2.5} />
        </ScalePressable>
        <Text className="text-primary min-w-[18px] text-center text-xs font-bold tabular-nums">
          {qty}
        </Text>
        <ScalePressable
          haptic
          onPress={onIncrement}
          disabled={atMax}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          className={cn(`${stepperBtn} items-center justify-center`, atMax && 'opacity-40')}>
          <Icon as={Plus} className={`${iconSize} text-primary`} strokeWidth={2.5} />
        </ScalePressable>
      </View>
    );
  }

  return (
    <Button variant="primary" size="sm" className="min-h-8 rounded-md px-3" onPress={onAdd}>
      <Text className="text-micro">+ Add</Text>
    </Button>
  );
}

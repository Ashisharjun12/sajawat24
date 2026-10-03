import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { Pressable, View } from 'react-native';

export type FulfillmentMode = 'instant' | 'scheduled';

type ProductFulfillmentTabsProps = {
  value: FulfillmentMode;
  onChange: (mode: FulfillmentMode) => void;
  instantLabel?: string | null;
};

export function ProductFulfillmentTabs({
  value,
  onChange,
  instantLabel,
}: ProductFulfillmentTabsProps) {
  const isScheduled = value === 'scheduled';
  const isInstant = value === 'instant';

  return (
    <View className="w-full flex-row border-b border-border">
      <Pressable
        onPress={() => onChange('scheduled')}
        className={cn(
          'flex-1 items-center border-b-2 px-2 pb-2 pt-0.5',
          isScheduled ? 'border-primary' : 'border-transparent',
        )}
        accessibilityRole="button">
        <Text
          className={cn(
            'text-sm font-semibold',
            isScheduled ? 'text-foreground' : 'text-muted-foreground',
          )}>
          Schedule
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('instant')}
        className={cn(
          'flex-1 items-center border-b-2 px-2 pb-2 pt-0.5',
          isInstant ? 'border-orange-500' : 'border-transparent',
        )}
        accessibilityRole="button">
        <Text
          className={cn(
            'text-sm font-semibold',
            isInstant ? 'text-orange-600' : 'text-muted-foreground',
          )}
          style={isInstant ? { color: INSTANT_TAB_HEX } : undefined}>
          {(instantLabel ?? 'Instant').trim()}
        </Text>
      </Pressable>
    </View>
  );
}

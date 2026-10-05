import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { CalendarDays, Zap } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type FulfillmentMode = 'instant' | 'scheduled';

type ProductFulfillmentTabsProps = {
  value: FulfillmentMode;
  onChange: (mode: FulfillmentMode) => void;
  instantLabel?: string | null;
};

/** Matches web `FulfillmentModeSwitch` — calendar + filled zap on tabs. */
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
          'flex-1 flex-row items-center justify-center gap-2 border-b-2 px-2 pb-3 pt-1',
          isScheduled ? '-mb-px border-primary' : 'border-transparent',
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isScheduled }}>
        <Icon
          as={CalendarDays}
          className={cn('size-5 shrink-0', isScheduled ? 'text-primary' : 'text-muted-foreground')}
        />
        <Text
          className={cn(
            'text-sm font-semibold',
            isScheduled ? 'text-primary' : 'text-muted-foreground',
          )}>
          Schedule
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('instant')}
        className={cn(
          'flex-1 flex-row items-center justify-center gap-2 border-b-2 px-2 pb-3 pt-1',
          isInstant ? '-mb-px border-instant' : 'border-transparent',
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isInstant }}>
        <Icon
          as={Zap}
          className={cn('size-5 shrink-0', isInstant ? 'text-instant' : 'text-muted-foreground')}
          fill={isInstant ? INSTANT_TAB_HEX : 'transparent'}
        />
        <Text
          className={cn(
            'text-sm font-semibold',
            isInstant ? 'text-instant' : 'text-muted-foreground',
          )}
          style={isInstant ? { color: INSTANT_TAB_HEX } : undefined}>
          {(instantLabel ?? 'Instant').trim()}
        </Text>
      </Pressable>
    </View>
  );
}

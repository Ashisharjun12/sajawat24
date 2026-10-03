import { PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ScrollView, View } from 'react-native';

export type PillOption<T extends string> = {
  value: T;
  label: string;
  /** Small count badge rendered next to the label, e.g. pending items. */
  badgeCount?: number;
};

type PillFilterProps<T extends string> = {
  value: T;
  options: PillOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function PillFilter<T extends string>({
  value,
  options,
  onChange,
  className,
}: PillFilterProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={cn('gap-2', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => {
              triggerHaptic();
              onChange(option.value);
            }}
            className={cn(
              'rounded-full px-4 py-2.5',
              active ? 'bg-primary' : 'bg-muted',
            )}>
            <View className="flex-row items-center gap-1.5">
              <Text
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-primary-foreground' : 'text-muted-foreground',
                )}>
                {option.label}
              </Text>
              {option.badgeCount ? (
                <View
                  className={cn(
                    'min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5',
                    active ? 'bg-primary-foreground/25' : 'bg-primary',
                  )}>
                  <Text
                    className={cn(
                      'text-[11px] font-semibold leading-none',
                      active ? 'text-primary-foreground' : 'text-primary-foreground',
                    )}>
                    {option.badgeCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
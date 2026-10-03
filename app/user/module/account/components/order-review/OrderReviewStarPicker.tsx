import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

type Props = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
};

export function OrderReviewStarPicker({ value, onChange, disabled }: Props) {
  const label = value > 0 ? LABELS[value - 1] : 'Tap a star to rate';

  return (
    <View className="items-center gap-2">
      <View className="flex-row gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const star = index + 1;
          const filled = star <= value;
          return (
            <Pressable
              key={star}
              disabled={disabled}
              onPress={() => onChange(star)}
              accessibilityRole="button"
              accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
              className="p-1 active:opacity-80">
              <Text
                className={cn(
                  'text-4xl leading-none',
                  filled ? 'text-amber-500' : 'text-muted-foreground/25',
                )}>
                ★
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text
        className={cn(
          'text-sm font-semibold',
          value > 0 ? 'text-amber-700' : 'text-muted-foreground',
        )}>
        {label}
      </Text>
    </View>
  );
}

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type ProductStarRowProps = {
  rating: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASS = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
} as const;

/** Filled amber stars + muted empty — matches web `StarRow`. */
export function ProductStarRow({ rating, size = 'md', className }: ProductStarRowProps) {
  const value = Number(rating ?? 0);
  const filled = Math.min(5, Math.max(0, Math.round(value)));

  return (
    <View
      className={cn('flex-row gap-0.5', className)}
      accessibilityLabel={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text
          key={index}
          className={cn(
            SIZE_CLASS[size],
            index < filled ? 'text-amber-500' : 'text-muted-foreground/30',
          )}
          accessibilityElementsHidden>
          ★
        </Text>
      ))}
    </View>
  );
}

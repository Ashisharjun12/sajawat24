import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type HomeHeaderIconBadgeProps = {
  count: number;
};

/** Circular red count on home header actions (wishlist, bag, notifications). */
export function HomeHeaderIconBadge({ count }: HomeHeaderIconBadgeProps) {
  if (count <= 0) return null;

  const label = count > 9 ? '9+' : String(count);
  const wide = label.length > 1;

  return (
    <View
      className={cn(
        'absolute -right-0.5 -top-0.5 items-center justify-center rounded-full bg-destructive',
        wide ? 'h-5 min-w-5 px-1' : 'size-5',
      )}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text className="text-[10px] font-bold leading-none text-destructive-foreground">
        {label}
      </Text>
    </View>
  );
}

import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { type Href, router } from 'expo-router';
import { View } from 'react-native';

type ProductRailHeaderProps = {
  title?: string | null;
  subtitle?: string | null;
  viewAllHref?: Href | null;
  viewAllLabel?: string;
  className?: string;
};

export function ProductRailHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  className,
}: ProductRailHeaderProps) {
  const showTitle = Boolean(title?.trim());
  const showSubtitle = Boolean(subtitle?.trim());
  const showViewAll = Boolean(viewAllHref);

  if (!showTitle && !showSubtitle && !showViewAll) {
    return null;
  }

  return (
    <View className={cn('flex-row items-start justify-between gap-3', className)}>
      <View className="min-w-0 flex-1 gap-0.5">
        {showTitle ? (
          <Text className="text-foreground text-base font-bold leading-snug tracking-tight">
            {title}
          </Text>
        ) : null}
        {showSubtitle ? (
          <Text className="text-muted-foreground text-xs leading-relaxed">{subtitle}</Text>
        ) : null}
      </View>
      {showViewAll ? (
        <ScalePressable
          onPress={() => router.push(viewAllHref!)}
          haptic
          className="shrink-0 self-center pt-0.5"
          accessibilityRole="button"
          accessibilityLabel={viewAllLabel}>
          <Text className="text-muted-foreground text-xs font-medium">{viewAllLabel} →</Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}

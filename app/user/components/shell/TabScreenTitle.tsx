import { ScreenBackButton } from '@/components/shell/ScreenBackButton';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Href } from 'expo-router';
import { View } from 'react-native';

type TabScreenTitleProps = {
  title: string;
  subtitle?: string | null;
  showBack?: boolean;
  onBack?: () => void;
  /** Pop target when history is empty (e.g. offers opened outside product stack). */
  fallbackHref?: Href;
  /** Replace with home when back is unavailable. */
  orHome?: boolean;
  backAccessibilityLabel?: string;
  /** Set when parent `Screen` uses `gutter` — avoids double horizontal padding. */
  insetFromParentGutter?: boolean;
};

/** Fixed tab header — title stays visible while content scrolls below. */
export function TabScreenTitle({
  title,
  subtitle,
  showBack = false,
  onBack,
  fallbackHref,
  orHome = false,
  backAccessibilityLabel = 'Go back',
  insetFromParentGutter = false,
}: TabScreenTitleProps) {
  if (showBack) {
    return (
      <View
        className={cn(
          'border-b border-border/60 bg-background pb-3 pt-1',
          !insetFromParentGutter && 'px-4',
        )}>
        <View className="min-h-11 flex-row items-center">
          <ScreenBackButton
            onPress={onBack}
            fallbackHref={fallbackHref}
            orHome={orHome}
            accessibilityLabel={backAccessibilityLabel}
          />
          <Text
            className="text-foreground min-w-0 flex-1 text-center text-lg font-bold tracking-tight"
            numberOfLines={1}>
            {title}
          </Text>
          <View className="size-10" />
        </View>
        {subtitle ? (
          <Text className="text-muted-foreground mt-1 px-10 text-center text-sm" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="border-b border-border/60 bg-background px-5 pb-3 pt-1">
      <Text className="text-foreground text-2xl font-bold tracking-tight">{title}</Text>
      {subtitle ? (
        <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

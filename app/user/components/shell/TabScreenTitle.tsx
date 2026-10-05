import { ScreenBackButton } from '@/components/shell/ScreenBackButton';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabScreenTitleProps = {
  title: string;
  subtitle?: string | null;
  /** Teal app header (home-style); includes top safe area. */
  tone?: 'default' | 'primary';
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
  tone = 'default',
  showBack = false,
  onBack,
  fallbackHref,
  orHome = false,
  backAccessibilityLabel = 'Go back',
  insetFromParentGutter = false,
}: TabScreenTitleProps) {
  const insets = useSafeAreaInsets();
  const isPrimary = tone === 'primary';

  if (showBack) {
    return (
      <View
        className={cn(
          !insetFromParentGutter && 'px-4',
          isPrimary
            ? 'border-b border-primary-dark/25 bg-primary pb-3'
            : 'border-b border-border/60 bg-background pb-3 pt-1',
        )}
        style={isPrimary ? { paddingTop: insets.top + 4 } : undefined}>
        <View className="min-h-11 flex-row items-center">
          <ScreenBackButton
            onPress={onBack}
            fallbackHref={fallbackHref}
            orHome={orHome}
            accessibilityLabel={backAccessibilityLabel}
            className={isPrimary ? 'bg-white/20 active:bg-white/30' : undefined}
            iconClassName={isPrimary ? 'size-5 text-primary-foreground' : 'size-5 text-foreground'}
          />
          <Text
            className={cn(
              'min-w-0 flex-1 text-center text-lg font-bold tracking-tight',
              isPrimary ? 'text-primary-foreground' : 'text-foreground',
            )}
            numberOfLines={1}>
            {title}
          </Text>
          <View className="size-10" />
        </View>
        {subtitle ? (
          <Text
            className={cn(
              'mt-1 px-10 text-center text-sm',
              isPrimary ? 'text-primary-foreground/85' : 'text-muted-foreground',
            )}
            numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="border-b border-border/60 bg-background px-5 pb-3 pt-1">
      <Text className="text-foreground text-h1 font-semibold">{title}</Text>
      {subtitle ? (
        <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

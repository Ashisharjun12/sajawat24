import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatUnreadBadgeCount } from '@/module/notifications/lib/notification-format';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBell?: boolean;
  unreadCount?: number;
  /** Replaces the notifications bell when set (e.g. Team add button). */
  trailing?: ReactNode;
  className?: string;
};

export function ScreenHeader({
  title,
  subtitle,
  showBell = true,
  unreadCount = 0,
  trailing,
  className,
}: ScreenHeaderProps) {
  const badgeLabel = formatUnreadBadgeCount(unreadCount);

  return (
    <View className={cn('flex-row items-start justify-between gap-3', className)}>
      <View className="flex-1 gap-1">
        <Text className="text-2xl font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-muted-foreground text-sm">{subtitle}</Text> : null}
      </View>
      {trailing ?? null}
      {!trailing && showBell ? (
        <PressableScale
          className="relative size-11 items-center justify-center rounded-full bg-muted"
          onPress={() => router.push('/(app)/notifications')}
          accessibilityLabel="Notifications"
          scaleTo={0.92}>
          <Icon as={Bell} className="text-foreground size-5" />
          {badgeLabel ? (
            <View className="absolute -right-0.5 -top-0.5 min-w-[22px] items-center justify-center rounded-full bg-primary px-1 py-0.5">
              <Text className="text-[10px] font-semibold text-primary-foreground">{badgeLabel}</Text>
            </View>
          ) : null}
        </PressableScale>
      ) : null}
    </View>
  );
}

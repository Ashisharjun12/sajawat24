import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { NotificationBell } from './NotificationBell';

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
  return (
    <View className={cn('flex-row items-start justify-between gap-3', className)}>
      <View className="flex-1 gap-1">
        <Text className="text-2xl font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-muted-foreground text-sm">{subtitle}</Text> : null}
      </View>
      {trailing ?? null}
      {!trailing && showBell ? <NotificationBell unreadCount={unreadCount} /> : null}
    </View>
  );
}

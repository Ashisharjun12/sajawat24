import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatUnreadBadgeCount } from '@/module/notifications/lib/notification-format';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

type NotificationBellProps = {
  unreadCount?: number;
  /** `onPrimary` renders light controls for use on a brand-green background. */
  tone?: 'default' | 'onPrimary';
  className?: string;
};

export function NotificationBell({
  unreadCount = 0,
  tone = 'default',
  className,
}: NotificationBellProps) {
  const badgeLabel = formatUnreadBadgeCount(unreadCount);
  const onPrimary = tone === 'onPrimary';

  return (
    <PressableScale
      className={cn(
        'relative size-11 items-center justify-center rounded-full',
        onPrimary ? 'bg-primary-foreground/15' : 'bg-muted',
        className,
      )}
      onPress={() => router.push('/(app)/notifications')}
      accessibilityLabel="Notifications"
      scaleTo={0.92}>
      <Icon
        as={Bell}
        className={cn('size-5', onPrimary ? 'text-primary-foreground' : 'text-foreground')}
      />
      {badgeLabel ? (
        <View
          className={cn(
            'absolute -right-0.5 -top-0.5 min-w-[22px] items-center justify-center rounded-full px-1 py-0.5',
            onPrimary ? 'bg-cta' : 'bg-primary',
          )}>
          <Text
            className={cn(
              'text-[10px] font-semibold',
              onPrimary ? 'text-cta-foreground' : 'text-primary-foreground',
            )}>
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

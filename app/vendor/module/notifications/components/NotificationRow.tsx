import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatNotificationRowWhen } from '@/module/notifications/lib/notification-format';
import type { VendorInboxNotification } from '@/module/notifications/lib/notification-types';
import { getNotificationVisual } from '@/module/notifications/lib/notification-visual';
import { View } from 'react-native';

type NotificationRowProps = {
  item: VendorInboxNotification;
  onPress: (item: VendorInboxNotification) => void;
};

export function NotificationRow({ item, onPress }: NotificationRowProps) {
  const unread = !item.readAt;
  const visual = getNotificationVisual(item.data.event);
  const when = formatNotificationRowWhen(item.createdAt);

  return (
    <PressableScale onPress={() => onPress(item)} scaleTo={0.99}>
      <View className="flex-row items-start gap-3 pb-5 pt-2">
        <View
          className={cn(
            'mt-1 size-11 shrink-0 items-center justify-center rounded-2xl',
            visual.iconBg,
          )}>
          <Icon as={visual.icon} className={cn('size-5', visual.iconColor)} />
        </View>

        <View className="min-w-0 flex-1 gap-2 pt-2">
          <Text className="text-foreground text-[15px] leading-5" numberOfLines={2}>
            <Text className={cn(unread ? 'font-bold' : 'font-semibold')}>{item.title}</Text>
            <Text className="text-muted-foreground font-normal"> · {when}</Text>
          </Text>
          <Text
            className={cn(
              'text-[13px] leading-[18px]',
              unread ? 'text-foreground/90' : 'text-muted-foreground',
            )}
            numberOfLines={3}>
            {item.body}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

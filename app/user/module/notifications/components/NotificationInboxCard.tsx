import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatNotificationRowWhen } from '@/module/notifications/lib/notification-format';
import type { NotificationInboxItem } from '@/module/notifications/lib/notification-inbox-filter';
import { Pressable, View } from 'react-native';

type NotificationInboxCardProps = {
  item: NotificationInboxItem;
  onPress: (item: NotificationInboxItem) => void;
};

export function NotificationInboxCard({ item, onPress }: NotificationInboxCardProps) {
  const when = formatNotificationRowWhen(item.createdAt);
  const showUnread = item.unread && item.kind === 'push';

  return (
    <Pressable onPress={() => onPress(item)} className="active:opacity-90">
      <View
        className={cn(
          'rounded-2xl border bg-surface px-4 py-3.5',
          showUnread ? 'border-primary/40' : 'border-border/70',
        )}>
        <View className="flex-row items-start gap-2">
          {showUnread ? <View className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-foreground text-[15px] font-bold leading-5" numberOfLines={2}>
              {item.title}
            </Text>
            <Text
              className={cn(
                'text-[13px] leading-[18px]',
                showUnread ? 'text-foreground/90' : 'text-muted-foreground',
              )}
              numberOfLines={3}>
              {item.body}
            </Text>
            <Text className="text-micro text-muted-foreground">{when}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

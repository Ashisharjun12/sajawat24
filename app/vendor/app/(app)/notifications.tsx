import { PressableScale } from '@/components/motion';
import { Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { NotificationEmpty } from '@/module/notifications/components/NotificationEmpty';
import { NotificationListSkeleton } from '@/module/notifications/components/NotificationListSkeleton';
import { NotificationRow } from '@/module/notifications/components/NotificationRow';
import { useNotificationNavigation } from '@/module/notifications/hooks/use-notification-navigation';
import { useVendorNotifications } from '@/module/notifications/hooks/use-vendor-notifications';
import { groupNotificationsByDate } from '@/module/notifications/lib/group-notifications-by-date';
import type { VendorInboxNotification } from '@/module/notifications/lib/notification-types';
import { useScreenRefresh } from '@/hooks/use-screen-refresh';
import { useCallback, useMemo } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { SectionList, View } from 'react-native';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isError,
    refetch,
    loadMore,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useVendorNotifications();
  const refetchAll = useCallback(() => refetch(), [refetch]);
  const { refreshControl } = useScreenRefresh(refetchAll);
  const handlePress = useNotificationNavigation({ markRead });

  const sections = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      void loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: VendorInboxNotification }) => (
      <NotificationRow item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text className="text-foreground pb-1 pt-5 text-base font-bold">{section.title}</Text>
    ),
    [],
  );

  const showMarkAllRead = !isLoading && !isError;
  const canMarkAllRead = unreadCount > 0 && !isMarkingAllRead;

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return <View className="h-4" />;
    return (
      <View className="items-center py-4">
        <AppSpinner size="sm" />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <Screen scroll={false} contentClassName="flex-1 pb-0">
      <View className="gap-3 pb-3">
        <PressableScale
          onPress={() => router.back()}
          className="-ml-1 self-start"
          accessibilityLabel="Go back"
          scaleTo={0.92}>
          <View className="size-10 items-center justify-center">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
          </View>
        </PressableScale>

        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-foreground flex-1 text-2xl font-bold">Notifications</Text>
          {showMarkAllRead ? (
            <PressableScale
              className="shrink-0"
              onPress={() => void markAllRead()}
              disabled={!canMarkAllRead}
              scaleTo={0.97}>
              <View
                className={cn(
                  'rounded-full border px-3.5 py-2',
                  canMarkAllRead ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40',
                )}>
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    canMarkAllRead ? 'text-primary' : 'text-muted-foreground',
                  )}>
                  {isMarkingAllRead ? 'Updating…' : 'Mark all read'}
                </Text>
              </View>
            </PressableScale>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <NotificationListSkeleton />
      ) : isError ? (
        <View className="gap-3 rounded-3xl bg-muted/70 px-5 py-10">
          <Text className="text-muted-foreground text-center text-sm">
            Could not load notifications. Check your connection and try again.
          </Text>
          <Button className="rounded-full" variant="secondary" onPress={() => void refetch()}>
            <Text>Retry</Text>
          </Button>
        </View>
      ) : notifications.length === 0 ? (
        <NotificationEmpty />
      ) : (
        <SectionList
          className="flex-1"
          refreshControl={refreshControl}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          ItemSeparatorComponent={() => <View className="h-px bg-border/40" />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.35}
          ListFooterComponent={listFooter}
        />
      )}
    </Screen>
  );
}

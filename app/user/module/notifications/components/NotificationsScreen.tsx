import { Screen, TabScreenTitle } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useGoBack } from '@/lib/use-go-back';
import { NotificationEmpty } from '@/module/notifications/components/NotificationEmpty';
import { NotificationListSkeleton } from '@/module/notifications/components/NotificationListSkeleton';
import { NotificationRow } from '@/module/notifications/components/NotificationRow';
import { useNotificationNavigation } from '@/module/notifications/hooks/use-notification-navigation';
import { useUserNotifications } from '@/module/notifications/hooks/use-user-notifications';
import { groupNotificationsByDate } from '@/module/notifications/lib/group-notifications-by-date';
import type { UserInboxNotification } from '@/module/notifications/lib/notification-types';
import { type Href, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';

type NotificationsFrom = 'home' | 'profile';

export function NotificationsScreen() {
  const { from: fromParam } = useLocalSearchParams<{ from?: string }>();
  const from: NotificationsFrom = fromParam === 'profile' ? 'profile' : 'home';
  const backFallback =
    from === 'profile' ? ('/(app)/profile' as Href) : ('/(app)/' as Href);
  const onBack = useGoBack({ fallbackHref: backFallback });

  const [pullRefreshing, setPullRefreshing] = useState(false);
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
  } = useUserNotifications();
  const handlePress = useNotificationNavigation({ markRead });

  const sections = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      void loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: UserInboxNotification }) => (
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
    <Screen scroll={false} edges={['top', 'left', 'right']} gutter contentClassName="flex-1 pb-0">
      <TabScreenTitle title="Notifications" showBack onBack={onBack} insetFromParentGutter />
      {showMarkAllRead ? (
        <View className="mb-3 flex-row justify-end">
          <Pressable
            onPress={() => void markAllRead()}
            disabled={!canMarkAllRead}
            className="active:opacity-80">
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
          </Pressable>
        </View>
      ) : null}

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
          refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => void onRefresh()} />}
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

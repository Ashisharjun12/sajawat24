import { Screen, TabScreenTitle } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { openCmsLink } from '@/lib/open-cms-link';
import { useGoBack } from '@/lib/use-go-back';
import { useHomeCms } from '@/module/home/hooks/use-home-cms';
import { NotificationEmpty } from '@/module/notifications/components/NotificationEmpty';
import { NotificationInboxCard } from '@/module/notifications/components/NotificationInboxCard';
import { NotificationInboxFilterChips } from '@/module/notifications/components/NotificationInboxFilterChips';
import { NotificationListSkeleton } from '@/module/notifications/components/NotificationListSkeleton';
import { useNotificationNavigation } from '@/module/notifications/hooks/use-notification-navigation';
import { useUserNotifications } from '@/module/notifications/hooks/use-user-notifications';
import { groupInboxByDate } from '@/module/notifications/lib/group-inbox-by-date';
import {
  buildNotificationInboxItems,
  type NotificationInboxFilter,
  type NotificationInboxItem,
} from '@/module/notifications/lib/notification-inbox-filter';
import { useAvailableCoupons } from '@/module/promotions/hooks/use-available-coupons';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';

type NotificationsFrom = 'home' | 'profile';

export function NotificationsScreen() {
  const { from: fromParam } = useLocalSearchParams<{ from?: string }>();
  const from: NotificationsFrom = fromParam === 'profile' ? 'profile' : 'home';
  const backFallback =
    from === 'profile' ? ('/(app)/profile' as Href) : ('/(app)/' as Href);
  const onBack = useGoBack({ fallbackHref: backFallback });

  const [filter, setFilter] = useState<NotificationInboxFilter>('all');
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
  const { announcements } = useHomeCms();
  const { coupons } = useAvailableCoupons({ scope: 'city' });
  const handlePushPress = useNotificationNavigation({ markRead });

  const inboxItems = useMemo(
    () =>
      buildNotificationInboxItems({
        filter,
        notifications,
        announcements,
        coupons,
      }),
    [filter, notifications, announcements, coupons],
  );

  const sections = useMemo(() => groupInboxByDate(inboxItems), [inboxItems]);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (filter === 'all' && hasMore && !isLoadingMore) {
      void loadMore();
    }
  }, [filter, hasMore, isLoadingMore, loadMore]);

  const handleInboxPress = useCallback(
    (item: NotificationInboxItem) => {
      if (item.kind === 'push' && item.push) {
        handlePushPress(item.push);
        return;
      }
      if (item.kind === 'cms' && item.cms?.href) {
        openCmsLink(item.cms.href);
        return;
      }
      if (item.kind === 'coupon') {
        router.push('/(app)/offers' as Href);
      }
    },
    [handlePushPress],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationInboxItem }) => (
      <NotificationInboxCard item={item} onPress={handleInboxPress} />
    ),
    [handleInboxPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text className="text-foreground pb-2 pt-4 text-base font-bold">{section.title}</Text>
    ),
    [],
  );

  const showMarkAllRead = !isLoading && !isError;
  const canMarkAllRead = unreadCount > 0 && !isMarkingAllRead;

  const markAllTrailing = showMarkAllRead ? (
    <Pressable
      onPress={() => void markAllRead()}
      disabled={!canMarkAllRead}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel="Mark all read">
      <Text
        className={cn(
          'text-xs font-semibold',
          canMarkAllRead ? 'text-primary' : 'text-muted-foreground',
        )}>
        {isMarkingAllRead ? 'Updating…' : 'Mark all read'}
      </Text>
    </Pressable>
  ) : (
    <View className="size-10" />
  );

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return <View className="h-4" />;
    return (
      <View className="items-center py-4">
        <AppSpinner size="sm" />
      </View>
    );
  }, [isLoadingMore]);

  const emptyOffers = filter === 'offers' && inboxItems.length === 0;

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} gutter contentClassName="flex-1 pb-0">
      <TabScreenTitle
        title="Notifications"
        showBack
        onBack={onBack}
        insetFromParentGutter
        trailing={markAllTrailing}
      />

      <NotificationInboxFilterChips value={filter} onChange={setFilter} />

      {isLoading ? (
        <NotificationListSkeleton />
      ) : isError ? (
        <View className="gap-3 rounded-3xl bg-muted/70 px-5 py-10">
          <Text className="text-muted-foreground text-center text-sm">
            Could not load notifications. Check your connection and try again.
          </Text>
          <Button variant="secondary" onPress={() => void refetch()}>
            <Text>Retry</Text>
          </Button>
        </View>
      ) : inboxItems.length === 0 ? (
        <View className="flex-1 gap-3">
          <NotificationEmpty />
          {emptyOffers ? (
            <Button variant="secondary" onPress={() => router.push('/(app)/offers' as Href)}>
              <Text>Browse all offers</Text>
            </Button>
          ) : null}
        </View>
      ) : (
        <SectionList
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={pullRefreshing} onRefresh={() => void onRefresh()} />
          }
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8 gap-3"
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.35}
          ListFooterComponent={listFooter}
        />
      )}
    </Screen>
  );
}

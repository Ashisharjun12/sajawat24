import {
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  type UserNotification,
} from '@/api/notifications.api';
import { NOTIFICATIONS_PAGE_SIZE } from '@/module/notifications/lib/notification-pagination';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import {
  parseNotificationData,
  type UserInboxNotification,
} from '@/module/notifications/lib/notification-types';
import { useAuthStore } from '@/store/auth.store';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

function mapNotification(item: UserNotification): UserInboxNotification {
  return {
    ...item,
    data: parseNotificationData(item.data),
  };
}

export function useUserNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const enabled = Boolean(accessToken);

  const query = useInfiniteQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: async ({ pageParam }) => {
      const response = await listUserNotifications({
        page: pageParam,
        limit: NOTIFICATIONS_PAGE_SIZE,
      });
      return {
        ...response,
        items: response.items.map(mapNotification),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled,
  });

  const queryClient = useQueryClient();

  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        refetch();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [enabled, refetch]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markUserNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllUserNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
    loadMore: query.fetchNextPage,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}

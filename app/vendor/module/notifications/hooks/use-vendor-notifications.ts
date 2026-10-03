import {
  listVendorNotifications,
  markAllVendorNotificationsRead,
  markVendorNotificationRead,
  type VendorNotification,
} from '@/api/notifications.api';
import { NOTIFICATIONS_PAGE_SIZE } from '@/module/notifications/lib/notification-pagination';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import {
  parseNotificationData,
  type VendorInboxNotification,
} from '@/module/notifications/lib/notification-types';
import { usePartnerNotificationsEnabled } from '@/module/partner/shared/use-partner-notifications-enabled';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { useAuthStore } from '@/store/auth.store';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const FIELD_HIDDEN_EVENTS = new Set(['VENDOR_NEW_JOB', 'PAYOUT_PAID', 'PAYOUT_FAILED']);
const OWNER_HIDDEN_EVENTS = new Set(['VENDOR_JOB_ASSIGNED']);

function mapNotification(item: VendorNotification): VendorInboxNotification {
  return {
    ...item,
    data: parseNotificationData(item.data),
  };
}

export function useVendorNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);
  const enabled = usePartnerNotificationsEnabled(accessToken, user);

  const query = useInfiniteQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: async ({ pageParam }) => {
      const response = await listVendorNotifications({
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
    mutationFn: (id: string) => markVendorNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllVendorNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  const notifications = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.items) ?? [];
    const hidden = isFieldShell ? FIELD_HIDDEN_EVENTS : OWNER_HIDDEN_EVENTS;
    return all.filter((item) => !hidden.has(item.data.event ?? ''));
  }, [query.data?.pages, isFieldShell]);
  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = Boolean(query.hasNextPage);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  return {
    notifications,
    total,
    unreadCount,
    hasMore,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
    loadMore: query.fetchNextPage,
    invalidate: refetch,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}

export function invalidateVendorNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
}

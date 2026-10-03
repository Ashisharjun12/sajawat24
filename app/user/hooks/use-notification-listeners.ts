import { usePushRegistration } from '@/hooks/use-push-registration';
import { configureForegroundNotifications } from '@/lib/notifications';
import { queryKeys } from '@/lib/query-keys';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import { extractNotificationData } from '@/module/notifications/lib/notification-types';
import { resolveNotificationTarget } from '@/module/notifications/lib/resolve-notification-target';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Href, router } from 'expo-router';
import { useEffect } from 'react';

function invalidateForNotificationData(
  queryClient: ReturnType<typeof useQueryClient>,
  data: Record<string, unknown> | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

  const parsed = extractNotificationData(data);
  if (parsed.orderId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(parsed.orderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orderTracking(parsed.orderId) });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activeOrdersHome() });
  }
}

export function useNotificationListeners() {
  usePushRegistration();
  const queryClient = useQueryClient();

  useEffect(() => {
    configureForegroundNotifications();

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      invalidateForNotificationData(queryClient, data);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      invalidateForNotificationData(queryClient, data);
      const parsed = extractNotificationData(data);
      router.push(resolveNotificationTarget(parsed) as Href);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient]);
}

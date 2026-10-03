import { configureForegroundNotifications } from '@/lib/notifications';
import {
  extractNotificationData,
  resolveNotificationTarget,
} from '@/module/notifications/lib/resolve-notification-target';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import { vendorJobsKeys } from '@/module/bookings/hooks/use-vendor-jobs';
import { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isUrgentVendorPushEvent } from '@/module/notifications/lib/urgent-push-events';

function navigateFromNotificationData(data: Record<string, unknown> | undefined) {
  const parsed = extractNotificationData(data);
  router.push(resolveNotificationTarget(parsed) as Href);
}

/**
 * Refreshes any queries a given notification affects. Falls back to this
 * push-driven invalidation when the socket (see SocketProvider) missed the
 * event, e.g. the app was backgrounded when the push arrived.
 */
function invalidateForNotificationData(
  queryClient: QueryClient,
  data: Record<string, unknown> | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

  const parsed = extractNotificationData(data);
  if (
    parsed.event === VENDOR_NEW_JOB_NOTIFICATION_EVENT ||
    parsed.event === 'VENDOR_JOB_ASSIGNED'
  ) {
    void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
  }
}

export function useNotificationListeners() {
  usePushRegistration();
  const queryClient = useQueryClient();

  useEffect(() => {
    configureForegroundNotifications();

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      const parsed = extractNotificationData(data);
      if (Platform.OS === 'android' && isUrgentVendorPushEvent(parsed.event)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      invalidateForNotificationData(queryClient, data);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      invalidateForNotificationData(queryClient, data);
      navigateFromNotificationData(data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient]);
}

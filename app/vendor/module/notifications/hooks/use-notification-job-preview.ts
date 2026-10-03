import { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';
import { useVendorNotifications } from '@/module/notifications/hooks/use-vendor-notifications';
import { useMemo } from 'react';

export function useNotificationJobPreview(orderId: string) {
  const { notifications } = useVendorNotifications();

  return useMemo(() => {
    const match = notifications.find((item) => item.data.orderId === orderId);
    if (!match) return null;

    return {
      orderRef: match.data.orderRef ?? match.title,
      scheduledAt: match.data.scheduledAt ?? '',
      address: match.data.address ?? match.body,
      title: match.title,
      body: match.body,
      needsAction: match.data.event === VENDOR_NEW_JOB_NOTIFICATION_EVENT,
    };
  }, [notifications, orderId]);
}

import { useVendorNotifications } from '@/module/notifications/hooks/use-vendor-notifications';

export function useUnreadNotificationCount() {
  const { notifications } = useVendorNotifications();
  return notifications.filter((item) => !item.readAt).length;
}

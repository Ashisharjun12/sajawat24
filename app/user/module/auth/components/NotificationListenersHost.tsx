import { useNotificationListeners } from '@/hooks/use-notification-listeners';

export function NotificationListenersHost() {
  useNotificationListeners();
  return null;
}

import type { NotificationData } from '@/module/notifications/lib/notification-types';
import type { Href } from 'expo-router';

const ORDER_EVENTS = new Set([
  'BOOKING_CONFIRMED',
  'BOOKING_ASSIGNED',
  'VENDOR_EN_ROUTE',
  'VENDOR_ON_SITE',
  'BOOKING_COMPLETED',
  'BOOKING_REMINDER',
]);

export function resolveNotificationTarget(data: NotificationData): Href {
  if (data.orderId && (ORDER_EVENTS.has(data.event ?? '') || data.event === 'CHAT_MESSAGE')) {
    return `/(app)/profile/orders/${data.orderId}` as Href;
  }

  return '/(app)/notifications?from=home' as Href;
}

import type { UserNotification } from '@/api/notifications.api';

export type NotificationEvent = string;

export type NotificationData = {
  event?: NotificationEvent;
  orderId?: string;
  orderRef?: string;
  scheduledAt?: string;
  address?: string;
  notificationId?: string;
  conversationId?: string;
  conversationType?: string;
};

export type UserInboxNotification = UserNotification & {
  data: NotificationData;
};

export function parseNotificationData(data: Record<string, unknown>): NotificationData {
  return {
    event: typeof data.event === 'string' ? data.event : undefined,
    orderId:
      typeof data.orderId === 'string'
        ? data.orderId
        : typeof data.bookingId === 'string'
          ? data.bookingId
          : undefined,
    orderRef: typeof data.orderRef === 'string' ? data.orderRef : undefined,
    scheduledAt: typeof data.scheduledAt === 'string' ? data.scheduledAt : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    notificationId:
      typeof data.notificationId === 'string' ? data.notificationId : undefined,
    conversationId:
      typeof data.conversationId === 'string' ? data.conversationId : undefined,
    conversationType:
      typeof data.conversationType === 'string' ? data.conversationType : undefined,
  };
}

export function extractNotificationData(
  payload: Record<string, unknown> | undefined,
): NotificationData {
  if (!payload) return {};
  return parseNotificationData(payload);
}

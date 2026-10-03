import type { VendorNotification } from '@/api/notifications.api';
import type { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';

export type NotificationEvent = typeof VENDOR_NEW_JOB_NOTIFICATION_EVENT | string;

export type NotificationData = {
  event?: NotificationEvent;
  orderId?: string;
  orderRef?: string;
  scheduledAt?: string;
  address?: string;
  notificationId?: string;
  conversationId?: string;
  conversationType?: string;
  payoutRequestId?: string;
  amountFormatted?: string;
};

export type VendorInboxNotification = VendorNotification & {
  data: NotificationData;
};

export function parseNotificationData(data: Record<string, unknown>): NotificationData {
  return {
    event: typeof data.event === 'string' ? data.event : undefined,
    orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
    orderRef: typeof data.orderRef === 'string' ? data.orderRef : undefined,
    scheduledAt: typeof data.scheduledAt === 'string' ? data.scheduledAt : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    notificationId:
      typeof data.notificationId === 'string' ? data.notificationId : undefined,
    conversationId:
      typeof data.conversationId === 'string' ? data.conversationId : undefined,
    conversationType:
      typeof data.conversationType === 'string' ? data.conversationType : undefined,
    payoutRequestId:
      typeof data.payoutRequestId === 'string' ? data.payoutRequestId : undefined,
    amountFormatted:
      typeof data.amountFormatted === 'string' ? data.amountFormatted : undefined,
  };
}

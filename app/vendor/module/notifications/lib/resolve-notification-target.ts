import { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';
import type { NotificationData } from '@/module/notifications/lib/notification-types';
import type { Href } from 'expo-router';

export function resolveNotificationTarget(data: NotificationData): Href {
  if (data.event === VENDOR_NEW_JOB_NOTIFICATION_EVENT && data.orderId) {
    return `/(app)/bookings/${data.orderId}` as Href;
  }

  if (data.event === 'VENDOR_JOB_ASSIGNED' && data.orderId) {
    return `/(app)/bookings/${data.orderId}` as Href;
  }

  if (data.event === 'CHAT_MESSAGE') {
    if (data.conversationType === 'booking' && data.orderId) {
      return `/(app)/bookings/${data.orderId}` as Href;
    }
    if (data.conversationType === 'vendor_support') {
      return '/(app)/support' as Href;
    }
  }

  if (data.event === 'PAYOUT_PAID' || data.event === 'PAYOUT_FAILED') {
    return '/(app)/payouts' as Href;
  }

  return '/(app)/notifications' as Href;
}

export function extractNotificationData(
  payload: Record<string, unknown> | undefined,
): NotificationData {
  if (!payload) return {};

  return {
    event: typeof payload.event === 'string' ? payload.event : undefined,
    orderId: typeof payload.orderId === 'string' ? payload.orderId : undefined,
    orderRef: typeof payload.orderRef === 'string' ? payload.orderRef : undefined,
    scheduledAt: typeof payload.scheduledAt === 'string' ? payload.scheduledAt : undefined,
    address: typeof payload.address === 'string' ? payload.address : undefined,
    notificationId:
      typeof payload.notificationId === 'string' ? payload.notificationId : undefined,
    conversationId:
      typeof payload.conversationId === 'string' ? payload.conversationId : undefined,
    conversationType:
      typeof payload.conversationType === 'string' ? payload.conversationType : undefined,
    payoutRequestId:
      typeof payload.payoutRequestId === 'string' ? payload.payoutRequestId : undefined,
    amountFormatted:
      typeof payload.amountFormatted === 'string' ? payload.amountFormatted : undefined,
  };
}

import { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';

const URGENT_VENDOR_PUSH_EVENTS = new Set([
  VENDOR_NEW_JOB_NOTIFICATION_EVENT,
  'VENDOR_JOB_ASSIGNED',
]);

export function isUrgentVendorPushEvent(event: string | undefined): boolean {
  return Boolean(event && URGENT_VENDOR_PUSH_EVENTS.has(event));
}

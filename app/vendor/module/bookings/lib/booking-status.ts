import type { BookingStatus } from '@/module/bookings/lib/booking.types';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Pending accept',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'On the way',
  ON_SITE: 'At location',
  COMPLETED: 'Completed',
};

export function bookingStatusLabel(status: string) {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status.replace(/_/g, ' ');
}

export function bookingStatusBadgeClass(status: BookingStatus | string) {
  switch (status) {
    case 'CONFIRMED':
    case 'ASSIGNED':
      return 'bg-amber-500/15';
    case 'EN_ROUTE':
    case 'ON_SITE':
      return 'bg-sky-500/15';
    case 'COMPLETED':
      return 'bg-emerald-500/15';
    default:
      return 'bg-muted';
  }
}

export function bookingStatusTextClass(status: BookingStatus | string) {
  switch (status) {
    case 'CONFIRMED':
    case 'ASSIGNED':
      return 'text-amber-800';
    case 'EN_ROUTE':
    case 'ON_SITE':
      return 'text-sky-800';
    case 'COMPLETED':
      return 'text-emerald-800';
    default:
      return 'text-foreground';
  }
}

export function isActiveBookingStatus(status: BookingStatus) {
  return status === 'EN_ROUTE' || status === 'ON_SITE';
}

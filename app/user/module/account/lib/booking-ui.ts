import { format } from 'date-fns';
import type { OrderStatus } from '@/api/orders.api';

export type OrderListBucket = 'all' | 'upcoming' | 'completed' | 'cancelled';

export const ORDER_LIST_BUCKETS: { value: OrderListBucket; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ORDER_LIST_EMPTY_COPY: Record<
  OrderListBucket,
  { title: string; body: string }
> = {
  all: {
    title: 'No orders yet',
    body: 'When you book a decoration, it will show up here.',
  },
  upcoming: {
    title: 'No upcoming orders',
    body: 'Active bookings will appear here.',
  },
  completed: {
    title: 'No completed orders',
    body: 'Finished setups will appear here.',
  },
  cancelled: {
    title: 'No cancelled orders',
    body: 'Cancelled bookings will appear here.',
  },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Decorator assigned',
  EN_ROUTE: 'On the way',
  ON_SITE: 'On site',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

export function formatBookingSlot(iso: string | null | undefined): string {
  if (!iso) return 'To be confirmed';
  try {
    return format(new Date(iso), 'EEE d MMM, h a');
  } catch {
    return 'To be confirmed';
  }
}

export function bookingStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? String(status).replace(/_/g, ' ');
}

export function orderCardTitle(primaryName: string, itemCount: number): string {
  if (itemCount > 1) return `${primaryName} + ${itemCount - 1} more`;
  return primaryName;
}

export const BOOKING_TIMELINE: { key: string; label: string }[] = [
  { key: 'CONFIRMED', label: 'Booking confirmed' },
  { key: 'ASSIGNED', label: 'Decorator assigned' },
  { key: 'EN_ROUTE', label: 'On the way' },
  { key: 'ON_SITE', label: 'Setup in progress' },
  { key: 'COMPLETED', label: 'Complete' },
];

const TIMELINE_RANK: Record<string, number> = {
  CONFIRMED: 0,
  ASSIGNED: 1,
  EN_ROUTE: 2,
  ON_SITE: 3,
  COMPLETED: 4,
  DISPUTED: 3,
  CANCELLED: -1,
  PENDING_PAYMENT: -1,
  DRAFT: -1,
};

export function bookingTimelineIndex(status: string): number {
  return TIMELINE_RANK[status] ?? 0;
}

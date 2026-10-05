import type { OrderStatus } from '@/api/orders.api';
import { bookingStatusLabel } from '@/module/account/lib/booking-ui';

export type OrderStatusTone = 'active' | 'payment' | 'success' | 'cancelled' | 'muted';

export function isCheckoutAbandonedOrder(order: {
  status: string;
  checkoutAbandoned?: boolean;
}): boolean {
  return Boolean(order.checkoutAbandoned);
}

export function orderStatusTone(
  status: string,
  checkoutAbandoned = false,
): OrderStatusTone {
  if (checkoutAbandoned || status === 'CANCELLED') return 'cancelled';
  if (status === 'COMPLETED') return 'success';
  if (status === 'PENDING_PAYMENT') return 'payment';
  if (status === 'DISPUTED') return 'payment';
  if (status === 'DRAFT') return 'muted';
  return 'active';
}

export function orderStatusDisplayLabel(
  status: string,
  checkoutAbandoned = false,
): string {
  if (checkoutAbandoned) return 'Payment not completed';
  return bookingStatusLabel(status);
}

export function orderListAccentClass(tone: OrderStatusTone): string {
  switch (tone) {
    case 'payment':
      return 'bg-cta';
    case 'success':
      return 'bg-success';
    case 'cancelled':
      return 'bg-destructive';
    case 'active':
      return 'bg-primary';
    default:
      return 'bg-border';
  }
}

export function orderStatusPillClass(tone: OrderStatusTone): string {
  switch (tone) {
    case 'payment':
      return 'bg-cta/15';
    case 'success':
      return 'bg-success/15';
    case 'cancelled':
      return 'bg-destructive/15';
    case 'active':
      return 'bg-primary-tint';
    default:
      return 'bg-muted';
  }
}

export function orderStatusPillTextClass(tone: OrderStatusTone): string {
  switch (tone) {
    case 'payment':
      return 'text-cta';
    case 'success':
      return 'text-success';
    case 'cancelled':
      return 'text-destructive';
    case 'active':
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
}

export function shouldShowBookingTimeline(
  status: string,
  checkoutAbandoned = false,
): boolean {
  if (checkoutAbandoned) return false;
  if (status === 'PENDING_PAYMENT' || status === 'CANCELLED' || status === 'DRAFT') {
    return false;
  }
  return (
    status === 'COMPLETED' ||
    status === 'CONFIRMED' ||
    status === 'ASSIGNED' ||
    status === 'EN_ROUTE' ||
    status === 'ON_SITE' ||
    status === 'DISPUTED'
  );
}

export function isActiveBookingStatus(status: OrderStatus | string): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED' && status !== 'DRAFT';
}

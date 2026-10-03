import { formatPaise } from '@/lib/format-money';
import type { RefundListItem } from '@/api/refunds.api';

export const REFUND_STATUS_LABELS: Record<string, string> = {
  requested: 'Processing',
  processing: 'Processing',
  completed: 'Refunded',
  rejected: 'Declined',
};

export type RefundStatusVariant = 'default' | 'outline' | 'destructive';

export function refundStatusVariant(status: string): RefundStatusVariant {
  switch (status) {
    case 'completed':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function summarizeRefunds(refunds: RefundListItem[]) {
  let completedPaise = 0;
  let pendingPaise = 0;
  for (const row of refunds) {
    if (row.status === 'completed') {
      completedPaise += row.amountPaise;
    } else if (row.status !== 'rejected') {
      pendingPaise += row.amountPaise;
    }
  }
  return { completedPaise, pendingPaise };
}

export { formatPaise };

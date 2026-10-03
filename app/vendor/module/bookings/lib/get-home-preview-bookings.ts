import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';

const HIDDEN_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'DISPUTED']);

function bySoonestSlot(a: VendorJobSummary, b: VendorJobSummary): number {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

type PreviewOptions = {
  limit?: number;
  /** IDs already shown elsewhere on Home (e.g. the Next job hero). */
  excludeIds?: string[];
};

/** Accepted / in-progress bookings for the Home schedule preview (excludes pending response). */
export function getHomePreviewBookings(
  bookings: VendorJobSummary[],
  options: PreviewOptions = {},
): VendorJobSummary[] {
  const { limit = 4, excludeIds = [] } = options;
  const excluded = new Set(excludeIds);

  return bookings
    .filter(
      (booking) =>
        !booking.needsAction &&
        !HIDDEN_STATUSES.has(booking.status) &&
        !excluded.has(booking.id),
    )
    .sort(bySoonestSlot)
    .slice(0, limit);
}

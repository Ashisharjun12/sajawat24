import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';

export type MonthlyBookingStats = {
  completedThisMonth: number;
  earnedThisMonthPaise: number;
};

export type TodayEarningsStats = {
  completedToday: number;
  earnedTodayPaise: number;
};

function isSameDay(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isSameMonth(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
}

export function getTodayEarnings(
  bookings: VendorJobSummary[],
  now: Date = new Date(),
): TodayEarningsStats {
  const completedToday = bookings.filter(
    (booking) => booking.status === 'COMPLETED' && isSameDay(booking.scheduledAt, now),
  );

  return {
    completedToday: completedToday.length,
    earnedTodayPaise: completedToday.reduce((sum, booking) => sum + booking.subtotalPaise, 0),
  };
}

/**
 * Real, client-computed stats from the vendor's own completed bookings —
 * used instead of the mock payout summary so the Home screen only ever
 * shows real data. Note: this reflects bookings the app has already fetched
 * (see `useVendorJobs`'s page size), so it's an approximation until a
 * dedicated earnings/ledger endpoint exists.
 */
export function getMonthlyStats(
  bookings: VendorJobSummary[],
  now: Date = new Date(),
): MonthlyBookingStats {
  const completedThisMonth = bookings.filter(
    (booking) => booking.status === 'COMPLETED' && isSameMonth(booking.scheduledAt, now),
  );

  return {
    completedThisMonth: completedThisMonth.length,
    earnedThisMonthPaise: completedThisMonth.reduce(
      (sum, booking) => sum + booking.subtotalPaise,
      0,
    ),
  };
}

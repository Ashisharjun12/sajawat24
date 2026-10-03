import type { JobFilter } from '@/module/bookings/lib/booking.types';

type EmptyMessageContext = {
  isOnDuty: boolean;
  canToggle: boolean;
};

const BASE_MESSAGES: Record<JobFilter, string> = {
  today: 'No bookings scheduled for today.',
  upcoming: 'No upcoming bookings assigned yet.',
  completed: 'Completed bookings will show up here.',
  action: 'No bookings need your response right now.',
};

/**
 * Empty-state copy for the Bookings tab. "Nothing here" reads very
 * differently depending on whether the vendor can even receive new work
 * right now, so today/upcoming get an offline-aware nudge instead of a
 * generic empty message.
 */
export function getBookingsEmptyMessage(
  filter: JobFilter,
  { isOnDuty, canToggle }: EmptyMessageContext,
): string {
  const isDutyRelevant = filter === 'today' || filter === 'upcoming';
  if (isDutyRelevant && canToggle && !isOnDuty) {
    return "You're offline, so no new bookings are coming in. Go online from Home to start receiving them.";
  }
  return BASE_MESSAGES[filter];
}

import { getNextBooking } from '@/module/bookings/hooks/use-vendor-jobs';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';

/**
 * The single state that drives what the vendor Home screen shows. Priority
 * order (top wins): a vendor can only be in one of these at a time.
 *
 * 1. `pending_approval` / `rejected` / `blocked` — onboarding gate, duty
 *    toggle is locked and no booking sections should render underneath it.
 * 2. `needs_action` — one or more bookings are waiting on accept/decline.
 * 3. `active_job` — an accepted booking is in progress today or upcoming.
 * 4. `online_idle` — online, nothing pending right now.
 * 5. `offline` — offline, nothing pending.
 */
export type HomeState =
  | 'pending_approval'
  | 'rejected'
  | 'blocked'
  | 'needs_action'
  | 'active_job'
  | 'online_idle'
  | 'offline';

export type HomeViewModel = {
  state: HomeState;
  /** Bookings needing accept/decline, soonest slot first. */
  pendingActionBookings: VendorJobSummary[];
  /** The next accepted, not-yet-completed booking, if any. */
  activeBooking: VendorJobSummary | null;
};

function onboardingGateState(onboardingStatus: string | null): HomeState | null {
  switch (onboardingStatus) {
    case 'PENDING':
      return 'pending_approval';
    case 'REJECTED':
      return 'rejected';
    case 'BLOCKED':
      return 'blocked';
    default:
      return null;
  }
}

function bySoonestSlot(a: VendorJobSummary, b: VendorJobSummary): number {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

/**
 * Computes the Home screen's state and the derived data each state needs.
 * Keeping this logic pure and in one place means the screen component only
 * has to render, never decide.
 *
 * @param bookings general (today + upcoming) bookings — used for the active
 *   job hero once nothing is waiting on a response.
 * @param pendingActionBookings the authoritative "needs my response" list
 *   (fetched separately since it must never miss an item, unlike the
 *   general list which is capped to a page size).
 */
export function getHomeViewModel(
  onboardingStatus: string | null,
  isOnDuty: boolean,
  bookings: VendorJobSummary[],
  pendingActionBookings: VendorJobSummary[],
): HomeViewModel {
  const gateState = onboardingGateState(onboardingStatus);
  const sortedPendingAction = [...pendingActionBookings].sort(bySoonestSlot);
  const activeCandidates = bookings.filter(
    (booking) => !booking.needsAction && booking.status !== 'COMPLETED',
  );
  const activeBooking = getNextBooking(activeCandidates);

  if (gateState) {
    return { state: gateState, pendingActionBookings: [], activeBooking: null };
  }
  if (sortedPendingAction.length > 0) {
    return { state: 'needs_action', pendingActionBookings: sortedPendingAction, activeBooking };
  }
  if (activeBooking) {
    return { state: 'active_job', pendingActionBookings: [], activeBooking };
  }
  return {
    state: isOnDuty ? 'online_idle' : 'offline',
    pendingActionBookings: [],
    activeBooking: null,
  };
}

import { useScreenRefresh } from '@/hooks/use-screen-refresh';
import { useVendorJobs } from '@/module/bookings/hooks/use-vendor-jobs';
import type { JobFilter } from '@/module/bookings/lib/booking.types';
import { useCallback } from 'react';

type RefetchFn = () => Promise<unknown> | unknown;

/**
 * Shared data + refresh wiring for Home and Bookings list screens.
 * Fetches the main list (optional filter) plus the action queue, and
 * exposes a single pull-to-refresh control for both queries.
 */
export function useVendorJobsScreen(filter?: JobFilter, extraRefetches: RefetchFn[] = []) {
  const {
    data: listData,
    isLoading,
    refetch: refetchList,
  } = useVendorJobs(filter);
  const { data: actionData, refetch: refetchAction } = useVendorJobs('action');

  const refetchAll = useCallback(
    () =>
      Promise.all([refetchList(), refetchAction(), ...extraRefetches.map((fn) => fn())]),
    [refetchList, refetchAction, extraRefetches],
  );
  const { refreshControl } = useScreenRefresh(refetchAll);

  const bookings = listData?.items ?? [];
  const actionBookings = actionData?.items ?? [];

  return {
    bookings,
    actionBookings,
    actionCount: actionBookings.length,
    isLoading,
    refreshControl,
    refetch: refetchAll,
  };
}

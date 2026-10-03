import { listVendorJobs } from '@/api/jobs.api';
import { useScreenRefresh } from '@/hooks/use-screen-refresh';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { JobFilter } from '@/module/bookings/lib/booking.types';
import { VENDOR_JOBS_PAGE_SIZE } from '@/module/bookings/lib/vendor-jobs-pagination';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

export function useVendorJobsInfinite(filter: JobFilter, search: string) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: ['vendor-jobs', 'infinite', filter, debouncedSearch],
    queryFn: ({ pageParam }) =>
      listVendorJobs({
        filter,
        page: pageParam,
        limit: VENDOR_JOBS_PAGE_SIZE,
        q: debouncedSearch || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const bookings = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = bookings.length < total;

  const refetchAll = useCallback(() => query.refetch(), [query]);
  const { refreshControl } = useScreenRefresh(refetchAll);

  return {
    bookings,
    total,
    hasMore,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refreshControl,
    loadMore: () => {
      if (hasMore && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}

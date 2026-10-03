import { listTeamMembersPage } from '@/api/team.api';
import { TEAM_PAGE_SIZE } from '@/module/team/lib/team-pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/** Active workers eligible for field assignment (paginated + search). */
export function useAssignableWorkers(search: string, enabled = true) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: ['vendor-team', 'assign-picker', debouncedSearch],
    queryFn: ({ pageParam }) =>
      listTeamMembersPage({
        page: pageParam,
        limit: TEAM_PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: 'active',
      }),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const workers = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = workers.length < total;

  return {
    workers,
    total,
    hasMore,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
    loadMore: () => {
      if (hasMore && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}

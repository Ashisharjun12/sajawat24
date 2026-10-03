import { listTeamMembersPage, type TeamStatusCounts } from '@/api/team.api';
import { TEAM_PAGE_SIZE } from '@/module/team/lib/team-pagination';
import type { TeamFilter } from '@/module/team/lib/team-filters';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

function statusParam(filter: TeamFilter) {
  return filter === 'all' ? undefined : filter;
}

export function useTeamMembers(filter: TeamFilter, search: string) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: ['vendor-team', filter, debouncedSearch],
    queryFn: ({ pageParam }) =>
      listTeamMembersPage({
        page: pageParam,
        limit: TEAM_PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: statusParam(filter),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const members = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const statusCounts: TeamStatusCounts =
    query.data?.pages[0]?.statusCounts ?? { all: 0, active: 0, invited: 0, disabled: 0 };

  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = members.length < total;

  return {
    members,
    statusCounts,
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

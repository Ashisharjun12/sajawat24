import {
  getPayoutRequests,
  getWalletActivity,
  getWalletSummary,
  requestWalletWithdraw,
} from '@/api/wallet.api';
import type { WalletActivityDateRange } from '@/module/payouts/lib/wallet-activity-date';
import { WALLET_ACTIVITY_PAGE_SIZE } from '@/module/payouts/lib/wallet-activity-pagination';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export const walletKeys = {
  all: ['wallet'] as const,
  summary: () => [...walletKeys.all, 'summary'] as const,
  activity: (type?: string, from?: string, to?: string) =>
    [...walletKeys.all, 'activity', type ?? 'all', from ?? '', to ?? ''] as const,
  payoutRequests: (page = 1) => [...walletKeys.all, 'payout-requests', page] as const,
};

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: getWalletSummary,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useWalletActivity(
  type: 'earnings' | 'cod' | 'withdrawals',
  dateRange: WalletActivityDateRange,
) {
  const query = useInfiniteQuery({
    queryKey: walletKeys.activity(type, dateRange.from, dateRange.to),
    queryFn: async ({ pageParam }) =>
      getWalletActivity({
        page: pageParam,
        limit: WALLET_ACTIVITY_PAGE_SIZE,
        type,
        from: dateRange.from,
        to: dateRange.to,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    items,
    total,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
    loadMore: query.fetchNextPage,
  };
}

export function useWalletPayoutRequests(page = 1) {
  return useQuery({
    queryKey: walletKeys.payoutRequests(page),
    queryFn: () => getPayoutRequests({ page, limit: 20 }),
  });
}

export function useWalletWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amountPaise, payoutMethodId }: { amountPaise: number; payoutMethodId: string }) =>
      requestWalletWithdraw(amountPaise, payoutMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

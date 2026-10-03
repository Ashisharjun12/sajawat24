import { collectCash, collectOnline, getCollectionStatus } from '@/api/collect.api';
import { vendorJobsKeys } from '@/module/bookings/hooks/use-vendor-jobs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

const COLLECTION_POLL_MS = 3000;
const SETTLED_COLLECTION_STATUSES = new Set(['collected_cash', 'collected_online']);

type UseCollectionStatusOptions = {
  enabled?: boolean;
  poll?: boolean;
  onCollected?: (status: string) => void;
};

export function useCollectionStatus(
  orderId: string,
  { enabled = true, poll = false, onCollected }: UseCollectionStatusOptions = {},
) {
  const queryClient = useQueryClient();
  const onCollectedRef = useRef(onCollected);
  onCollectedRef.current = onCollected;
  const collectedHandledRef = useRef(false);

  useEffect(() => {
    collectedHandledRef.current = false;
  }, [orderId, enabled]);

  const query = useQuery({
    queryKey: [...vendorJobsKeys.detail(orderId), 'collection'],
    queryFn: () => getCollectionStatus(orderId),
    enabled: Boolean(orderId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (state) => {
      if (!poll) return false;
      const status = state.state.data?.collectionStatus;
      if (status && status !== 'pending') return false;
      return COLLECTION_POLL_MS;
    },
  });

  useEffect(() => {
    const status = query.data?.collectionStatus;
    if (!status || status === 'pending' || !SETTLED_COLLECTION_STATUSES.has(status)) return;
    if (collectedHandledRef.current) return;
    collectedHandledRef.current = true;

    void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.detail(orderId) });
    onCollectedRef.current?.(status);
  }, [query.data?.collectionStatus, orderId, queryClient]);

  return query;
}

export function useCollectCash(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => collectCash(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.detail(orderId) });
      void queryClient.invalidateQueries({
        queryKey: [...vendorJobsKeys.detail(orderId), 'collection'],
      });
    },
  });
}

export function useCollectOnline(orderId: string) {
  const queryClient = useQueryClient();
  const collectionKey = [...vendorJobsKeys.detail(orderId), 'collection'];
  return useMutation({
    mutationFn: () => collectOnline(orderId),
    onSuccess: (data) => {
      queryClient.setQueryData(collectionKey, data);
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: collectionKey });
    },
  });
}

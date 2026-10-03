import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRefundRequest, getLatestRefundForOrder, listRefunds } from "@/api/refunds.api";
import { queryKeys } from "@/lib/query-keys";

export function useRefundsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.refunds(),
    queryFn: async () => {
      const data = await listRefunds({ page: 1, limit: 50 });
      return Array.isArray(data?.items) ? data.items : [];
    },
    staleTime: 30_000,
    ...options,
  });
}

export function useOrderRefundQuery(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.orderRefund(orderId),
    queryFn: async () => {
      const data = await getLatestRefundForOrder(orderId);
      return data?.refund ?? null;
    },
    enabled: Boolean(orderId) && enabled,
    staleTime: 15_000,
  });
}

export function useRefundMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: ({ orderId, reason }) => createRefundRequest(orderId, { reason }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.refunds() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderRefund(variables.orderId) });
    },
  });

  return { create };
}

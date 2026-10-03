import { submitOrderReview, type SubmitOrderReviewBody } from '@/api/orders.api';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubmitOrderReview(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitOrderReviewBody) => submitOrderReview(orderId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(orderId) });
    },
  });
}

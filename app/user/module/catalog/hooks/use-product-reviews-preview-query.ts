import { listProductReviews } from '@/api/reviews.api';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useProductReviewsPreviewQuery(productId: string | undefined, limit = 3) {
  return useQuery({
    queryKey: queryKeys.productReviews(productId ?? '_', limit),
    queryFn: () => listProductReviews(productId!, { page: 1, limit }),
    enabled: Boolean(productId),
    staleTime: 120_000,
  });
}

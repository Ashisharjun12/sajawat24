import { api, unwrap } from '@/api/client';

export function listProductReviews(
  productId: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
) {
  return api
    .get(`/catalog/products/${productId}/reviews`, { params: { page, limit } })
    .then(unwrap);
}

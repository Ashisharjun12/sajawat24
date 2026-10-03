import { api, unwrap } from "@/api/api";

export function listProductReviews(productId, { page = 1, limit = 10 } = {}) {
  return api
    .get(`/catalog/products/${productId}/reviews`, { params: { page, limit } })
    .then(unwrap);
}

export function submitOrderReview(orderId, body) {
  return api.post(`/orders/${orderId}/review`, body).then(unwrap);
}

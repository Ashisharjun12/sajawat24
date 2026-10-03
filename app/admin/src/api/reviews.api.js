import { api, unwrap } from "@/api/api";

export function listCustomerReviews({ page = 1, limit = 20, q, productId, status, rating } = {}) {
  return api
    .get("/admin/reviews/customer-reviews", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(productId ? { productId } : {}),
        ...(status ? { status } : {}),
        ...(rating ? { rating } : {}),
      },
    })
    .then(unwrap);
}

export function listProductCustomerReviews(productId, { page = 1, limit = 20 } = {}) {
  return api
    .get(`/admin/reviews/products/${productId}/customer-reviews`, { params: { page, limit } })
    .then(unwrap);
}

export function createCustomerReview(body) {
  return api.post("/admin/reviews/customer-reviews", body).then(unwrap);
}

export function patchCustomerReview(id, body) {
  return api.patch(`/admin/reviews/customer-reviews/${id}`, body).then(unwrap);
}

export function deleteCustomerReview(id) {
  return api.delete(`/admin/reviews/customer-reviews/${id}`).then(unwrap);
}

export function listVideoReviews({ page = 1, limit = 20, q, status } = {}) {
  return api
    .get("/admin/reviews/video-reviews", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      },
    })
    .then(unwrap);
}

export function createVideoReview(body) {
  return api.post("/admin/reviews/video-reviews", body).then(unwrap);
}

export function patchVideoReview(id, body) {
  return api.patch(`/admin/reviews/video-reviews/${id}`, body).then(unwrap);
}

export function deleteVideoReview(id) {
  return api.delete(`/admin/reviews/video-reviews/${id}`).then(unwrap);
}

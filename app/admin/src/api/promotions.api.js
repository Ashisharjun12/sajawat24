import { api, unwrap } from "@/api/api";

export function getPromotionsOverview() {
  return api.get("/admin/promotions/overview").then(unwrap);
}

export function listCoupons({ page = 1, limit = 50, q } = {}) {
  return api
    .get("/admin/promotions/coupons", {
      params: { page, limit, ...(q ? { q } : {}) },
    })
    .then(unwrap);
}

export function createCoupon(body) {
  return api.post("/admin/promotions/coupons", body).then(unwrap);
}

export function updateCoupon(id, body) {
  return api.patch(`/admin/promotions/coupons/${id}`, body).then(unwrap);
}

export function setCouponStatus(id, isActive) {
  return api.patch(`/admin/promotions/coupons/${id}/status`, { isActive }).then(unwrap);
}

export function listRedemptions({ page = 1, limit = 50, q } = {}) {
  return api
    .get("/admin/promotions/redemptions", {
      params: { page, limit, ...(q ? { q } : {}) },
    })
    .then(unwrap);
}

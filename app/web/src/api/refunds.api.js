import { api, unwrap } from "@/api/api";

export function listRefunds(params = {}) {
  return api.get("/user/refunds", { params }).then(unwrap);
}

export function createRefundRequest(orderId, body) {
  return api.post(`/user/refunds/orders/${orderId}`, body).then(unwrap);
}

export function getLatestRefundForOrder(orderId) {
  return api.get(`/user/refunds/orders/${orderId}/latest`).then(unwrap);
}

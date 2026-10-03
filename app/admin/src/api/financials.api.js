import { api, unwrap } from "@/api/api"

export function getOrderFinancials(orderId) {
  return api.get(`/admin/financials/orders/${orderId}`).then(unwrap)
}

export function getPlatformRevenue() {
  return api.get("/admin/financials/revenue").then(unwrap)
}

export function listRefundRequests(params) {
  return api.get("/admin/financials/refund-requests", { params }).then(unwrap)
}

export function patchRefundRequest(id, body) {
  return api.patch(`/admin/financials/refund-requests/${id}`, body).then(unwrap)
}

export function getOrderRefundRequest(orderId) {
  return api.get(`/admin/financials/orders/${orderId}/refund-request`).then(unwrap)
}

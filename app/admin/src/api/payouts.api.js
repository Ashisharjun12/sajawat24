import { api, unwrap } from "@/api/api"

export function getFinancialOverview() {
  return api.get("/admin/financials/overview").then(unwrap)
}

export function getVendorLiabilities(params) {
  return api.get("/admin/financials/vendors", { params }).then(unwrap)
}

export function getVendorWallet(vendorId) {
  return api.get(`/admin/financials/vendors/${vendorId}/wallet`).then(unwrap)
}

export function getPayoutRequests(params) {
  return api.get("/admin/financials/payout-requests", { params }).then(unwrap)
}

export function getPayoutRequestDetail(id) {
  return api.get(`/admin/financials/payout-requests/${id}`).then(unwrap)
}

export function updatePayoutRequest(id, payload) {
  return api.patch(`/admin/financials/payout-requests/${id}`, payload).then(unwrap)
}

export function getCodPendingOrders(params) {
  return api.get("/admin/financials/orders", { params }).then(unwrap)
}

export function getWebhookEndpoints() {
  return api.get("/payments/webhook-endpoints").then(unwrap)
}

export function refundOrder(orderId, payload) {
  return api.post(`/admin/financials/orders/${orderId}/refund`, payload).then(unwrap)
}

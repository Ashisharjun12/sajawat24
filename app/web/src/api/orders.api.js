import { api, unwrap } from "@/api/api";

export function listOrders(params = {}) {
  return api.get("/orders", { params }).then(unwrap);
}

export function createOrder(body) {
  return api.post("/orders", body).then(unwrap);
}

export function getOrder(id) {
  return api.get(`/orders/${id}`).then(unwrap);
}

export function cancelPendingOrder(id) {
  return api.post(`/orders/${id}/cancel`).then(unwrap);
}

export function resumeOrderCheckout(id) {
  return api.post(`/orders/${id}/checkout`).then(unwrap);
}

export function getOrderTracking(id) {
  return api.get(`/orders/${id}/tracking`).then(unwrap);
}

export function getOrderRoute(id) {
  return api.get(`/orders/${id}/route`).then(unwrap);
}

import { api, unwrap } from "@/api/api"

export function getNotificationChannels() {
  return api.get("/admin/settings/notifications").then(unwrap)
}

export function patchNotificationChannels(payload) {
  return api.patch("/admin/settings/notifications", payload).then(unwrap)
}

export function listNotificationTemplates() {
  return api.get("/admin/notification-templates").then(unwrap)
}

export function patchNotificationTemplate(id, payload) {
  return api.patch(`/admin/notification-templates/${id}`, payload).then(unwrap)
}

export function createNotificationTemplateVersion(id, payload) {
  return api.post(`/admin/notification-templates/${id}/versions`, payload).then(unwrap)
}

export function getPaymentMethods() {
  return api.get("/admin/settings/payments").then(unwrap)
}

export function patchPaymentMethods(payload) {
  return api.patch("/admin/settings/payments", payload).then(unwrap)
}

export function getPayoutPolicy() {
  return api.get("/admin/settings/payout-policy").then(unwrap)
}

export function patchPayoutPolicy(payload) {
  return api.patch("/admin/settings/payout-policy", payload).then(unwrap)
}

export function getBookingPolicy() {
  return api.get("/admin/settings/booking-policy").then(unwrap)
}

export function patchBookingPolicy(payload) {
  return api.patch("/admin/settings/booking-policy", payload).then(unwrap)
}

export function getAiPolicy() {
  return api.get("/admin/settings/ai").then(unwrap)
}

export function patchAiPolicy(payload) {
  return api.patch("/admin/settings/ai", payload).then(unwrap)
}

export function getInstantMarketplacePolicy() {
  return api.get("/admin/settings/instant-marketplace").then(unwrap)
}

export function patchInstantMarketplacePolicy(payload) {
  return api.patch("/admin/settings/instant-marketplace", payload).then(unwrap)
}

export function getInstantDispatchPolicy() {
  return api.get("/admin/settings/instant-dispatch").then(unwrap)
}

export function patchInstantDispatchPolicy(payload) {
  return api.patch("/admin/settings/instant-dispatch", payload).then(unwrap)
}

export function resolveInstantDispatchSystemUser() {
  return api.post("/admin/settings/instant-dispatch/system-user").then(unwrap)
}

export function getInstantMapsPolicy() {
  return api.get("/admin/settings/instant-maps").then(unwrap)
}

export function patchInstantMapsPolicy(payload) {
  return api.patch("/admin/settings/instant-maps", payload).then(unwrap)
}

export function getMessageServiceCatalog() {
  return api.get("/admin/settings/message-service/catalog").then(unwrap)
}

export function getDemoAuth() {
  return api.get("/admin/settings/demo-auth").then(unwrap)
}

export function patchDemoAuth(payload) {
  return api.patch("/admin/settings/demo-auth", payload).then(unwrap)
}

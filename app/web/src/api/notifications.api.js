import { api, unwrap } from "@/api/api"

export function listUserNotifications(params = {}) {
  return api.get("/user/notifications", { params }).then(unwrap)
}

export function markUserNotificationRead(id) {
  return api.patch(`/user/notifications/${id}/read`).then(unwrap)
}

export function markAllUserNotificationsRead() {
  return api.patch("/user/notifications/read-all").then(unwrap)
}

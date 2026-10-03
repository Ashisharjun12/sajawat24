export const NOTIFICATIONS_REFRESH_EVENT = "notifications:refresh"

export function requestNotificationsRefresh() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT))
}

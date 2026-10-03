import { useNotificationsStore } from "@/store/notifications.store"

export function useUserNotifications() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const total = useNotificationsStore((s) => s.total)
  const unreadCount = useNotificationsStore(
    (s) => s.notifications.filter((item) => !item.readAt).length,
  )
  const loading = useNotificationsStore((s) => s.loading)
  const loadingMore = useNotificationsStore((s) => s.loadingMore)
  const error = useNotificationsStore((s) => s.error)
  const lastIncomingAt = useNotificationsStore((s) => s.lastIncomingAt)
  const refetch = useNotificationsStore((s) => s.fetch)
  const loadMore = useNotificationsStore((s) => s.loadMore)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const hasMore = notifications.length < total

  return {
    notifications,
    total,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    lastIncomingAt,
    refetch,
    loadMore,
    markRead,
    markAllRead,
  }
}

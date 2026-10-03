import { create } from "zustand"
import {
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from "@/api/notifications.api"
import { getApiError } from "@/api/api"
import { NOTIFICATIONS_PAGE_SIZE } from "@/module/notifications/lib/notification-pagination"

const initialState = {
  notifications: [],
  total: 0,
  page: 1,
  loading: false,
  loadingMore: false,
  error: "",
  hydrated: false,
  lastIncomingAt: 0,
}

function mergeNotifications(existing, incoming) {
  const seen = new Set(existing.map((item) => item.id))
  const appended = incoming.filter((item) => !seen.has(item.id))
  return [...existing, ...appended]
}

export const useNotificationsStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetch: async () => {
    set({ loading: true, error: "" })
    try {
      const data = await listUserNotifications({ page: 1, limit: NOTIFICATIONS_PAGE_SIZE })
      const wasHydrated = get().hydrated
      const prevUnread = get().notifications.filter((item) => !item.readAt).length
      const nextItems = data?.items ?? []
      const nextUnread = nextItems.filter((item) => !item.readAt).length
      const hasNewUnread = wasHydrated && nextUnread > prevUnread
      set({
        notifications: nextItems,
        total: data?.total ?? 0,
        page: 1,
        loading: false,
        loadingMore: false,
        hydrated: true,
        lastIncomingAt: hasNewUnread ? Date.now() : get().lastIncomingAt,
      })
    } catch (err) {
      set({ loading: false, error: getApiError(err) })
    }
  },

  loadMore: async () => {
    const { loading, loadingMore, notifications, total, page } = get()
    if (loading || loadingMore || notifications.length >= total) return

    const nextPage = page + 1
    set({ loadingMore: true, error: "" })
    try {
      const data = await listUserNotifications({ page: nextPage, limit: NOTIFICATIONS_PAGE_SIZE })
      const incoming = data?.items ?? []
      set({
        notifications: mergeNotifications(notifications, incoming),
        total: data?.total ?? total,
        page: nextPage,
        loadingMore: false,
      })
    } catch (err) {
      set({ loadingMore: false, error: getApiError(err) })
    }
  },

  markRead: async (id) => {
    const row = await markUserNotificationRead(id)
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, readAt: row.readAt } : item,
      ),
    }))
    return row
  },

  markAllRead: async () => {
    const now = new Date().toISOString()
    const previous = get().notifications
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.readAt ? item : { ...item, readAt: now },
      ),
    }))
    try {
      const { count } = await markAllUserNotificationsRead()
      return count ?? 0
    } catch (err) {
      set({ notifications: previous })
      throw err
    }
  },
}))

export function selectUnreadCount(state) {
  return state.notifications.filter((item) => !item.readAt).length
}

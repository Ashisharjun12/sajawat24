import { useEffect, useRef } from "react"
import { toast } from "@/components/ui/toast"
import { NOTIFICATIONS_REFRESH_EVENT } from "@/module/notifications/lib/notification-events"
import { useAuthStore } from "@/store/auth.store"
import { useNotificationsStore } from "@/store/notifications.store"

export function NotificationsHost() {
  const user = useAuthStore((s) => s.user)
  const fetch = useNotificationsStore((s) => s.fetch)
  const reset = useNotificationsStore((s) => s.reset)
  const lastIncomingAt = useNotificationsStore((s) => s.lastIncomingAt)
  const notifications = useNotificationsStore((s) => s.notifications)
  const lastToastAtRef = useRef(0)

  useEffect(() => {
    if (user) {
      void fetch()
      return
    }
    reset()
  }, [user, fetch, reset])

  useEffect(() => {
    if (!user) return undefined
    const onRefresh = () => {
      void fetch()
    }
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh)
  }, [user, fetch])

  useEffect(() => {
    if (!user) return undefined
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetch()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [user, fetch])

  useEffect(() => {
    if (!user || !lastIncomingAt || lastIncomingAt === lastToastAtRef.current) return
    lastToastAtRef.current = lastIncomingAt
    const latest = notifications.find((item) => !item.readAt)
    if (!latest) return
    toast.add({
      title: latest.title,
      description: latest.body,
      type: "info",
    })
  }, [user, lastIncomingAt, notifications])

  return null
}

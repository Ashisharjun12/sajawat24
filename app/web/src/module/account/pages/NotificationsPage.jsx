import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { NotificationRow } from "@/module/notifications/components/NotificationRow"
import { resolveNotificationTarget } from "@/module/notifications/lib/resolve-notification-target"
import { useUserNotifications } from "@/module/notifications/hooks/use-user-notifications"

export function NotificationsPage() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    refetch,
    loadMore,
    markRead,
    markAllRead,
  } = useUserNotifications()

  async function handlePress(item) {
    if (!item.readAt) {
      try {
        await markRead(item.id)
      } catch {
        // still navigate
      }
    }
    navigate(resolveNotificationTarget(item.data ?? {}))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking updates and messages when you are away.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => void markAllRead()}
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-8" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4 rounded-full" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <NotificationRow key={item.id} item={item} onPress={handlePress} />
          ))}
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              className="mt-1 w-full rounded-full"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  Loading…
                </span>
              ) : (
                "View more"
              )}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

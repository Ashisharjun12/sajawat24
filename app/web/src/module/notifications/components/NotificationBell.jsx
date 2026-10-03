import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { BellIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useLockPageScrollWhen } from "@/lib/use-lock-page-scroll"
import { useMediaMdDown } from "@/module/catalog/hooks/use-media-md-down"
import { NotificationRow } from "@/module/notifications/components/NotificationRow"
import { useUserNotifications } from "@/module/notifications/hooks/use-user-notifications"
import { resolveNotificationTarget } from "@/module/notifications/lib/resolve-notification-target"
import { cn } from "@/lib/utils"

const PREVIEW_LIMIT = 8

function NotificationBellIcon({ shaking, unreadCount }) {
  return (
    <>
      <motion.span
        animate={shaking ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 inline-flex text-foreground"
      >
        <BellIcon className="size-5" />
      </motion.span>
      {unreadCount > 0 ? (
        <span
          className="pointer-events-none absolute -top-0.5 -right-0.5 z-20 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
          aria-hidden
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </>
  )
}

function NotificationsPanelBody({
  notifications,
  listItems,
  loading,
  error,
  refetch,
  onPress,
  fullScreen = false,
  hasMore,
  loadingMore,
  onLoadMore,
}) {
  const listClass = fullScreen
    ? "flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 touch-pan-y"
    : "max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain p-2 touch-pan-y"

  return (
    <div className={cn("flex flex-col", fullScreen && "min-h-0 flex-1")}>
      <div className={listClass} data-lenis-prevent>
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : error ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : listItems.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {listItems.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                compact
                onPress={onPress}
              />
            ))}
            {fullScreen && hasMore ? (
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full rounded-full"
                disabled={loadingMore}
                onClick={() => void onLoadMore()}
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Loading…
                  </span>
                ) : (
                  "Load more"
                )}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function NotificationBell({ className }) {
  const navigate = useNavigate()
  const isMdDown = useMediaMdDown()
  const [open, setOpen] = useState(false)
  const [shaking, setShaking] = useState(false)
  const lastIncomingRef = useRef(0)
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    lastIncomingAt,
    refetch,
    markRead,
    markAllRead,
    loadMore,
  } = useUserNotifications()

  useLockPageScrollWhen(open && isMdDown)

  const preview = notifications.slice(0, PREVIEW_LIMIT)

  useEffect(() => {
    if (!lastIncomingAt || lastIncomingAt === lastIncomingRef.current) return
    lastIncomingRef.current = lastIncomingAt
    setShaking(true)
    const timer = window.setTimeout(() => setShaking(false), 500)
    return () => window.clearTimeout(timer)
  }, [lastIncomingAt])

  async function handlePress(item) {
    if (!item.readAt) {
      try {
        await markRead(item.id)
      } catch {
        // still navigate
      }
    }
    setOpen(false)
    navigate(resolveNotificationTarget(item.data ?? {}))
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    try {
      await markAllRead()
    } catch {
      // ignore
    }
  }

  const triggerClassName = cn(
    "relative inline-flex size-9 shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium text-foreground transition-all outline-none select-none hover:bg-muted hover:text-foreground",
    className,
  )

  const markAllButton =
    unreadCount > 0 ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 shrink-0 rounded-full px-2.5 text-xs"
        onClick={() => void handleMarkAllRead()}
      >
        Mark all read
      </Button>
    ) : null

  const viewAllFooter =
    notifications.length > 0 ? (
      <div className="shrink-0 border-t border-border px-4 py-3">
        <Link
          to="/account/notifications"
          onClick={() => setOpen(false)}
          className={buttonVariants({
            variant: "secondary",
            className: "h-9 w-full rounded-full",
          })}
        >
          View all notifications
        </Link>
      </div>
    ) : null

  const bellIcon = (
    <NotificationBellIcon shaking={shaking} unreadCount={unreadCount} />
  )

  if (isMdDown) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          type="button"
          aria-label="Notifications"
          className={triggerClassName}
        >
          {bellIcon}
        </DialogTrigger>

        <DialogContent
          showCloseButton
          className="inset-0 top-0 left-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 ring-0 sm:max-w-none"
          overlayClassName="bg-background/80"
          data-lenis-prevent
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Booking updates and messages</DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 pr-14">
            <h2 className="font-heading text-base font-semibold">Notifications</h2>
            {markAllButton}
          </div>

          <NotificationsPanelBody
            fullScreen
            notifications={notifications}
            listItems={notifications}
            loading={loading}
            error={error}
            refetch={refetch}
            onPress={handlePress}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />

          {viewAllFooter}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="Notifications"
        className={triggerClassName}
      >
        {bellIcon}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(100vw-2rem,380px)] gap-0 p-0">
        <PopoverHeader className="flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
          <PopoverTitle>Notifications</PopoverTitle>
          {markAllButton}
        </PopoverHeader>

        <NotificationsPanelBody
          notifications={notifications}
          listItems={preview}
          loading={loading}
          error={error}
          refetch={refetch}
          onPress={handlePress}
        />

        {viewAllFooter}
      </PopoverContent>
    </Popover>
  )
}

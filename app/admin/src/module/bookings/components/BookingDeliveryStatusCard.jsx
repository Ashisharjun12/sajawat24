import {
  CheckIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  SparklesIcon,
  TruckIcon,
  UserCheckIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBookingSlot } from "@/module/bookings/lib/booking-format"
import {
  BOOKING_DELIVERY_STEPS,
  resolveDeliveryTrackerState,
} from "@/module/bookings/lib/booking-status"

const STEP_ICONS = [
  ClipboardCheckIcon,
  UserCheckIcon,
  TruckIcon,
  SparklesIcon,
  CircleCheckIcon,
]

const STEP_COLORS = [
  {
    ring: "border-blue-600",
    current: "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25",
    icon: "text-blue-600",
    well: "bg-blue-500/12",
  },
  {
    ring: "border-violet-600",
    current: "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/25",
    icon: "text-violet-600",
    well: "bg-violet-500/12",
  },
  {
    ring: "border-amber-500",
    current: "border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/25",
    icon: "text-amber-600 dark:text-amber-400",
    well: "bg-amber-500/12",
  },
  {
    ring: "border-sky-600",
    current: "border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-600/25",
    icon: "text-sky-600 dark:text-sky-400",
    well: "bg-sky-500/12",
  },
  {
    ring: "border-emerald-600",
    current: "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/25",
    icon: "text-emerald-600 dark:text-emerald-400",
    well: "bg-emerald-500/12",
  },
]

function StepNode({ index, label, state, showPendingNote }) {
  const Icon = STEP_ICONS[index]
  const colors = STEP_COLORS[index]
  const done = state === "done"
  const current = state === "current"

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-colors",
          done && "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20",
          current && !done && colors.current,
          !done && !current && cn("border-muted-foreground/20", colors.well, colors.icon),
        )}
      >
        {done ? <CheckIcon className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
      </span>
      <p
        className={cn(
          "max-w-22 text-xs leading-tight sm:max-w-none sm:text-sm",
          current || done ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      {showPendingNote ? (
        <p className="max-w-24 text-[10px] leading-tight text-amber-700 dark:text-amber-400 sm:max-w-none sm:text-xs">
          Waiting for vendor acceptance
        </p>
      ) : null}
    </div>
  )
}

function DeliveryTracker({ order }) {
  const tracker = resolveDeliveryTrackerState(order)
  const { activeIndex, allComplete, showVendorPending, isDisputed } = tracker
  const segmentCount = BOOKING_DELIVERY_STEPS.length - 1

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute top-5 right-[10%] left-[10%] flex h-0.5 -translate-y-1/2"
        aria-hidden
      >
        {Array.from({ length: segmentCount }).map((_, index) => {
          const filled = allComplete || activeIndex > index
          return (
            <div
              key={index}
              className={cn(
                "h-full min-w-0 flex-1",
                filled ? (isDisputed ? "bg-destructive" : "bg-yellow-400") : "bg-muted",
              )}
            />
          )
        })}
      </div>

      <ol className="relative grid w-full grid-cols-5">
        {BOOKING_DELIVERY_STEPS.map((step, index) => {
          const done = allComplete || activeIndex > index
          const current = !allComplete && activeIndex === index
          const state = done ? "done" : current ? "current" : "upcoming"
          const showPendingNote = showVendorPending && index === 1 && current

          return (
            <li key={step.key} className="flex min-w-0 flex-col items-center">
              <StepNode
                index={index}
                label={step.label}
                state={state}
                showPendingNote={showPendingNote}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function BookingDeliveryStatusCard({ order }) {
  const tracker = resolveDeliveryTrackerState(order)

  if (tracker.mode === "cancelled") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            This booking was cancelled.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (tracker.mode === "pre_tracker") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Tracking starts after payment is confirmed.
          </p>
        </CardContent>
      </Card>
    )
  }

  const subtitle = tracker.scheduledAt ? formatBookingSlot(tracker.scheduledAt) : null

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Delivery Status</CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge
            variant={tracker.isDisputed ? "destructive" : "default"}
            className={cn(!tracker.isDisputed && "bg-primary/90")}
          >
            {tracker.currentLabel}
          </Badge>
          {subtitle ? (
            <span className="text-muted-foreground">Setup {subtitle}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <DeliveryTracker order={order} />
      </CardContent>
    </Card>
  )
}

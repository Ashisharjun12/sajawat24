const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Needs assign",
  ASSIGNED: "Assigned",
  EN_ROUTE: "En route",
  ON_SITE: "On site",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
}

export function bookingStatusLabel(status) {
  return STATUS_LABELS[status] ?? String(status ?? "").replace(/_/g, " ")
}

export function bookingStatusBadgeClass(status) {
  switch (status) {
    case "CONFIRMED":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    case "ASSIGNED":
    case "EN_ROUTE":
    case "ON_SITE":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300"
    case "COMPLETED":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
    case "CANCELLED":
      return "bg-muted text-muted-foreground"
    case "DISPUTED":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export const BOOKING_STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "Needs assign" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "EN_ROUTE", label: "En route" },
  { value: "ON_SITE", label: "On site" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DISPUTED", label: "Disputed" },
]

export const BOOKING_DELIVERY_STEPS = [
  { key: "CONFIRMED", label: "Booking confirmed" },
  { key: "ASSIGNED", label: "Decorator assigned" },
  { key: "EN_ROUTE", label: "On the way" },
  { key: "ON_SITE", label: "Setup in progress" },
  { key: "COMPLETED", label: "Complete" },
]

const TIMELINE_RANK = {
  CONFIRMED: 0,
  ASSIGNED: 1,
  EN_ROUTE: 2,
  ON_SITE: 3,
  COMPLETED: 4,
  DISPUTED: 3,
  CANCELLED: -1,
  PENDING_PAYMENT: -1,
  DRAFT: -1,
}

function timelineIndexFromStatus(status) {
  return TIMELINE_RANK[status] ?? 0
}

/**
 * @param {{ status?: string, assignee?: { vendorResponse?: string } | null, scheduledAt?: string }} order
 */
export function resolveDeliveryTrackerState(order) {
  const status = order?.status ?? ""
  const vendorResponse = order?.assignee?.vendorResponse

  if (status === "CANCELLED") {
    return {
      mode: "cancelled",
      activeIndex: -1,
      currentLabel: "Cancelled",
      scheduledAt: order?.scheduledAt ?? null,
      showVendorPending: false,
      isDisputed: false,
    }
  }

  if (status === "PENDING_PAYMENT" || status === "DRAFT") {
    return {
      mode: "pre_tracker",
      activeIndex: -1,
      currentLabel: bookingStatusLabel(status),
      scheduledAt: order?.scheduledAt ?? null,
      showVendorPending: false,
      isDisputed: false,
    }
  }

  let activeIndex = timelineIndexFromStatus(status)

  if (status === "CONFIRMED") {
    if (vendorResponse === "pending") {
      activeIndex = 1
    } else if (!order?.assignee) {
      activeIndex = 0
    }
  }

  const isDisputed = status === "DISPUTED"
  const currentStep = BOOKING_DELIVERY_STEPS[activeIndex]
  const currentLabel = isDisputed ? "Disputed" : currentStep?.label ?? bookingStatusLabel(status)
  const showVendorPending = status === "CONFIRMED" && vendorResponse === "pending"

  return {
    mode: "tracker",
    activeIndex,
    currentLabel,
    scheduledAt: order?.scheduledAt ?? null,
    showVendorPending,
    isDisputed,
    allComplete: status === "COMPLETED",
  }
}

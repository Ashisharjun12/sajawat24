const STATUS_LABELS = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  disabled: "Disabled",
}

export function promotionStatusLabel(status) {
  return STATUS_LABELS[status] ?? String(status ?? "")
}

export function promotionStatusBadgeClass(status) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
    case "scheduled":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300"
    case "expired":
      return "bg-muted text-muted-foreground"
    case "disabled":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export const PROMOTION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
]

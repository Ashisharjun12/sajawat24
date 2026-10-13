export function customerStatusLabel(status) {
  switch (status) {
    case "active":
      return "Active"
    case "blocked":
      return "Blocked"
    case "deleted":
      return "Deleted"
    default:
      return String(status ?? "").replace(/_/g, " ") || "—"
  }
}

export function customerStatusBadgeClass(status) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
    case "blocked":
      return "bg-muted text-muted-foreground"
    case "deleted":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export const CUSTOMER_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "deleted", label: "Deleted" },
]

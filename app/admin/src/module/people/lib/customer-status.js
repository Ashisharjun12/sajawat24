export function customerStatusLabel(status) {
  switch (status) {
    case "active":
      return "Active"
    case "blocked":
      return "Blocked"
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
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export const CUSTOMER_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
]

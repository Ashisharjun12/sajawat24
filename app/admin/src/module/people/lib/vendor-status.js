export function vendorStatusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Pending approval"
    case "ACTIVE":
      return "Active"
    case "REJECTED":
      return "Rejected"
    case "BLOCKED":
      return "Blocked"
    default:
      return String(status ?? "").replace(/_/g, " ") || "—"
  }
}

export function vendorStatusBadgeClass(status) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
    case "REJECTED":
      return "bg-muted text-muted-foreground"
    case "BLOCKED":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export const VENDOR_STATUS_TABS = [
  { value: "pending", label: "Pending approval" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
  { value: "all", label: "All" },
]

export function vendorTabToStatus(tab) {
  switch (tab) {
    case "pending":
      return "PENDING"
    case "active":
      return "ACTIVE"
    case "rejected":
      return "REJECTED"
    case "blocked":
      return "BLOCKED"
    default:
      return null
  }
}

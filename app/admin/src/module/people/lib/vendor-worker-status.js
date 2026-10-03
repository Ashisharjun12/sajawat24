export const VENDOR_WORKER_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "disabled", label: "Disabled" },
]

export function workerTabToStatus(tab) {
  if (tab === "active" || tab === "invited" || tab === "disabled") return tab
  return undefined
}

export function formatInr(paise) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

export function formatCollectionStatus(status) {
  if (status === "not_required") return "Not required"
  if (status === "pending") return "Pending collection"
  if (status === "collected_cash") return "Cash collected"
  if (status === "collected_online") return "Paid online at door"
  return status
}

export function formatPayoutStatus(status) {
  if (status === "pending") return "Pending"
  if (status === "processing") return "Processing"
  if (status === "paid") return "Paid"
  if (status === "failed") return "Failed"
  if (status === "cancelled") return "Cancelled"
  return status
}

export const PAYOUT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

export const REFUND_STATUS_LABELS = {
  requested: "Pending",
  processing: "Processing",
  completed: "Refunded",
  rejected: "Declined",
}

export function refundStatusVariant(status) {
  if (status === "completed") return "default"
  if (status === "rejected") return "destructive"
  if (status === "processing") return "secondary"
  return "outline"
}

const DISPATCH_STATUS_LABELS = {
  idle: "Idle",
  searching: "Searching vendor",
  offering: "Offer sent",
  accepted: "Vendor accepted",
  exhausted: "Auto-dispatch exhausted",
  cancelled: "Dispatch cancelled",
}

export function dispatchStatusLabel(status) {
  if (!status) return "—"
  return DISPATCH_STATUS_LABELS[status] ?? status
}

export function fulfillmentTypeLabel(type) {
  if (type === "instant") return "Instant"
  if (type === "scheduled") return "Scheduled"
  return type ?? "—"
}

export function dispatchStatusVariant(status) {
  if (status === "exhausted") return "destructive"
  if (status === "accepted") return "default"
  if (status === "offering" || status === "searching") return "secondary"
  return "outline"
}

const OFFER_STATUS_LABELS = {
  offered: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  revoked: "Revoked",
}

export function dispatchOfferStatusLabel(status) {
  if (!status) return "—"
  return OFFER_STATUS_LABELS[status] ?? status
}

export function dispatchOfferStatusVariant(status) {
  if (status === "expired" || status === "declined" || status === "revoked") return "destructive"
  if (status === "accepted") return "default"
  if (status === "offered") return "secondary"
  return "outline"
}

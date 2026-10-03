import { formatPaise } from "@/lib/money";

export const REFUND_STATUS_LABELS = {
  requested: "Processing",
  processing: "Processing",
  completed: "Refunded",
  rejected: "Declined",
};

export function refundStatusVariant(status) {
  switch (status) {
    case "completed":
      return "default";
    case "processing":
    case "requested":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export function summarizeRefunds(refunds) {
  let completedPaise = 0;
  let pendingPaise = 0;
  for (const row of refunds) {
    if (row.status === "completed") {
      completedPaise += row.amountPaise;
    } else if (row.status !== "rejected") {
      pendingPaise += row.amountPaise;
    }
  }
  return { completedPaise, pendingPaise };
}

export { formatPaise };

export function isRefundRequestOpen(refund) {
  if (!refund) return false;
  return refund.status === "requested" || refund.status === "processing";
}

export function canRequestRefund(order, refund) {
  if (!order) return false;
  if (order.status !== "CANCELLED" && order.status !== "DISPUTED") return false;
  if (!refund) return true;
  if (refund.status === "completed") return false;
  if (isRefundRequestOpen(refund)) return false;
  return true;
}

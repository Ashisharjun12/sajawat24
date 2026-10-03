export class OnlinePaymentIncompleteError extends Error {
  constructor(orderId, message, userCancelled = false) {
    super(message);
    this.name = "OnlinePaymentIncompleteError";
    this.orderId = orderId;
    this.userCancelled = userCancelled;
  }
}

export function isPaymentCancelledMessage(message) {
  const lower = String(message).toLowerCase().trim();
  if (lower.includes("failed")) return false;
  return (
    lower === "payment cancelled" ||
    lower.includes("user closed") ||
    lower.includes("user cancelled") ||
    lower.includes("dismissed") ||
    lower.includes("aborted")
  );
}

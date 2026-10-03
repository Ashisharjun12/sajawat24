import { format } from "date-fns";

export function formatPaymentLabel(paymentMethod) {
  if (paymentMethod === "COD") return "Cash on delivery";
  return "Pay online";
}

export function formatOrderDate(iso) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatSetupSlot(iso) {
  if (!iso) return "To be confirmed";
  try {
    return format(new Date(iso), "EEE d MMM, h a");
  } catch {
    return "To be confirmed";
  }
}

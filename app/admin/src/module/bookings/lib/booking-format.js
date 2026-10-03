import { format } from "date-fns"

export function formatBookingSlot(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "EEE d MMM, h a")
  } catch {
    return "—"
  }
}

export function formatBookingDate(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "EEE, d MMM yyyy")
  } catch {
    return "—"
  }
}

export function formatBookingTime(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "h:mm a")
  } catch {
    return "—"
  }
}

export function formatPaymentMethod(method) {
  if (method === "COD") return "Cash on delivery"
  if (method === "ONLINE") return "Online"
  if (method === "PREPAID") return "Already paid"
  return method || "—"
}

export function formatAddonCount(count) {
  if (!count) return "No add-ons"
  if (count === 1) return "1 add-on"
  return `${count} add-ons`
}

export function formatCreateBookingPaymentMethod(method) {
  if (method === "prepaid") return "Already paid"
  if (method === "cod") return "Cash on delivery"
  return "—"
}

export function formatPaymentMethodShort(method) {
  if (method === "COD") return "COD"
  if (method === "ONLINE") return "Online"
  if (method === "PREPAID") return "Prepaid"
  return method || "—"
}

export function formatPackageLabel(booking) {
  const name = booking.primaryName || "Decoration booking"
  if (!booking.itemCount || booking.itemCount <= 1) return name
  return `${name} (+${booking.itemCount - 1} more)`
}

/** Clip long labels so the table does not force horizontal page scroll. */
export function clipText(value, maxLength = 9) {
  const text = String(value ?? "").trim()
  if (!text) return "—"
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function clipCityLabel(cityName, pincode, maxLength = 9) {
  const city = clipText(cityName, maxLength)
  const pin = String(pincode ?? "").trim()
  if (!pin || pin === "—") return city
  return `${city} · ${pin}`
}

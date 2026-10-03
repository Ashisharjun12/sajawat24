import { format } from "date-fns"
import { toSellAndCompare } from "@/lib/money"

const MIN_LEAD_MS = 2 * 60 * 60 * 1000

export const TIME_SLOTS = [
  { id: "9-12", label: "9 AM – 12 PM" },
  { id: "12-3", label: "12 PM – 3 PM" },
  { id: "3-6", label: "3 PM – 6 PM", fillingFast: true },
  { id: "6-9", label: "6 PM – 9 PM" },
  { id: "9-11", label: "9 PM – 11 PM" },
]

export function slotIdToHour(slotId) {
  if (slotId === "9-12") return 9
  if (slotId === "12-3") return 12
  if (slotId === "3-6") return 15
  if (slotId === "6-9") return 18
  return 21
}

export function hourToSlotId(hour) {
  if (hour < 12) return "9-12"
  if (hour < 15) return "12-3"
  if (hour < 18) return "3-6"
  if (hour < 21) return "6-9"
  return "9-11"
}

export function buildScheduledAtFromSlot(date, slotId) {
  const scheduled = new Date(date)
  scheduled.setHours(slotIdToHour(slotId), 0, 0, 0)
  return scheduled.toISOString()
}

export function parseScheduledAtToDateAndSlot(iso) {
  if (!iso) return { date: null, slotId: "9-12" }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { date: null, slotId: "9-12" }
  return { date, slotId: hourToSlotId(date.getHours()) }
}

export function galleryImages(product) {
  return (product?.images ?? []).filter((item) => item.kind === "image")
}

export function coverImage(product) {
  return galleryImages(product)[0] ?? product?.images?.[0] ?? null
}

export function imageSrc(item) {
  return item?.thumbnailUrl || item?.url || item?.publicUrl || item?.optimizedUrl || ""
}

export function productCoverUrl(product) {
  return imageSrc(coverImage(product))
}

export function cityPricePaise(product, cityId) {
  const row = (product?.prices ?? []).find((price) => price.cityId === cityId)
  if (row?.pricePaise) return row.pricePaise
  return product?.pricePaise ?? null
}

export function cityPriceTemplate(product, cityId) {
  const row = (product?.prices ?? []).find((price) => price.cityId === cityId)
  if (row) {
    const regular =
      row.compareAtPaise != null ? String(row.compareAtPaise / 100) : String(row.pricePaise / 100)
    const discounted = String(row.pricePaise / 100)
    return { regular, discounted }
  }
  if (product?.pricePaise) {
    return {
      regular: String(product.pricePaise / 100),
      discounted: String(product.pricePaise / 100),
    }
  }
  return null
}

export function formatInr(paise) {
  const rupees = Number(paise) / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees)
}

export function formatProductPrice(product, cityId) {
  const template = cityPriceTemplate(product, cityId)
  if (!template) return null
  const result = toSellAndCompare(template.regular, template.discounted)
  if (result.error) return null
  return result
}

export function filledPoints(items) {
  return (items ?? []).map((item) => String(item).trim()).filter(Boolean)
}

export function filledFaqs(items) {
  return (items ?? []).filter(
    (item) => (item.question ?? "").trim() && (item.answer ?? "").trim(),
  )
}

export function assertBookableSlotLocal(value) {
  if (!value) return "Pick a setup date and time"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date and time"
  if (date.getTime() <= Date.now() + MIN_LEAD_MS) {
    return "Slot must be at least 2 hours from now"
  }
  return null
}

export function formatSlotLabel(value) {
  if (!value) return "—"
  try {
    return format(new Date(value), "EEE d MMM, h a")
  } catch {
    return "—"
  }
}

export function addonLabels(addonIds, catalog) {
  const byId = new Map((catalog ?? []).map((row) => [row.id, row.name]))
  return addonIds.map((id) => byId.get(id) ?? "Add-on")
}

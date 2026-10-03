import { formatInr } from "@/module/payouts/lib/payout-format"

const DATE_OPTS = { day: "numeric", month: "short", year: "numeric" }

function discountHeadline(values) {
  if (values.type === "flat" && values.valuePaise) {
    return `${formatInr(values.valuePaise)} off`
  }
  if (values.type === "percent" && values.percent) {
    return `${values.percent}% off`
  }
  return "—"
}

function scopeSubtitle(values, targetLabels = []) {
  if (values.firstOrderOnly) return "first order"
  if (values.scope === "entire_cart") return "entire cart"
  if (values.scope === "products") {
    if (targetLabels.length === 1) return targetLabels[0].name
    if (targetLabels.length > 1) return `${targetLabels.length} products`
    return "selected products"
  }
  if (values.scope === "categories") {
    if (targetLabels.length === 1) return targetLabels[0].name
    if (targetLabels.length > 1) return `${targetLabels.length} categories`
    return "selected categories"
  }
  return null
}

function previewDescription(values, cityName, targetLabels) {
  const custom = values.description?.trim()
  if (custom) return custom

  if (values.firstOrderOnly) {
    return "Discount applied at checkout on your first order."
  }
  if (values.scope === "entire_cart") {
    return "Discount applied at checkout on eligible items in your cart."
  }
  if (values.scope === "products") {
    return "Discount applied at checkout on selected products in your cart."
  }
  if (values.scope === "categories") {
    return "Discount applied at checkout on items from selected categories."
  }
  if (cityName && cityName !== "All cities") {
    return `Valid for bookings in ${cityName}.`
  }
  return "Enter this code at checkout to apply the discount."
}

function previewConditions(values, cityName) {
  const conditions = []

  if (values.minOrderPaise > 0) {
    conditions.push({ icon: "bag", label: `Min order ${formatInr(values.minOrderPaise)}` })
  } else {
    conditions.push({ icon: "bag", label: "No minimum" })
  }

  if (values.endsAt) {
    const end = new Date(`${values.endsAt}T23:59:59`)
    if (!Number.isNaN(end.getTime())) {
      conditions.push({
        icon: "clock",
        label: `Until ${end.toLocaleDateString("en-IN", DATE_OPTS)}`,
      })
    }
  } else {
    conditions.push({ icon: "clock", label: "No expiry" })
  }

  if (cityName && cityName !== "All cities") {
    conditions.push({ icon: "pin", label: cityName })
  }

  if (values.paymentOnline && !values.paymentCod) {
    conditions.push({ icon: "card", label: "Online only" })
  } else if (values.paymentCod && !values.paymentOnline) {
    conditions.push({ icon: "card", label: "COD only" })
  }

  return conditions
}

function previewBadge(values) {
  if (!values.isActive) return { text: "Inactive", tone: "muted" }
  if (values.firstOrderOnly) return { text: "Popular", tone: "success" }
  if (values.type === "percent" && values.percent >= 15) return { text: "Popular", tone: "success" }
  return null
}

export function buildCouponPreviewFromForm(values, { cityName, targetLabels = [] } = {}) {
  const label = (values.name || values.code || "Coupon").trim().toUpperCase()
  const badge = previewBadge(values)

  return {
    label,
    discount: discountHeadline(values),
    badge: badge?.text ?? null,
    badgeTone: badge?.tone ?? "success",
    subtitle: scopeSubtitle(values, targetLabels),
    description: previewDescription(values, cityName, targetLabels),
    conditions: previewConditions(values, cityName),
    code: values.code?.trim() || "CODE",
  }
}

function statusBadge(coupon) {
  if (coupon.status === "expired") return { text: "Expired", tone: "muted" }
  if (coupon.status === "scheduled") return { text: "Scheduled", tone: "muted" }
  if (coupon.status === "disabled") return { text: "Disabled", tone: "muted" }
  return null
}

export function buildCouponPreviewFromCoupon(coupon) {
  if (!coupon) return null

  const percent =
    coupon.percentBps != null ? coupon.percentBps / 100 : coupon.percent ?? null

  const preview = buildCouponPreviewFromForm(
    {
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      valuePaise: coupon.valuePaise,
      percent,
      maxDiscountPaise: coupon.maxDiscountPaise,
      minOrderPaise: coupon.minOrderPaise ?? 0,
      scope: coupon.scope ?? "entire_cart",
      firstOrderOnly: coupon.firstOrderOnly ?? false,
      paymentOnline: coupon.allowedPaymentMethods?.includes("online") ?? true,
      paymentCod: coupon.allowedPaymentMethods?.includes("cod") ?? true,
      startsAt: coupon.startsAt?.slice?.(0, 10) ?? coupon.startsAt,
      endsAt: coupon.endsAt?.slice?.(0, 10) ?? coupon.endsAt,
      isActive: coupon.status === "active",
    },
    {
      cityName: coupon.cityName,
      targetLabels: coupon.targets ?? [],
    },
  )

  const status = statusBadge(coupon)
  if (status) {
    preview.badge = status.text
    preview.badgeTone = status.tone
  }

  if (!coupon.description?.trim() && coupon.eligibilitySummary) {
    preview.description = coupon.eligibilitySummary
  }

  return preview
}

function discountFromSummary(summary) {
  if (!summary) return "Discount"
  const match = summary.match(/^(.+?\s+off(?:\s+\(up to[^)]+\))?)/i)
  if (match) return match[1]
  return summary.split(".")[0] || "Discount"
}

export function buildCouponPreviewFromApplied(coupon) {
  if (!coupon) return null

  const summary = coupon.eligibilitySummary ?? ""
  const lower = summary.toLowerCase()
  const firstOrder = lower.includes("first order")

  const conditions = []
  const minMatch = summary.match(/Min order (₹[\d,]+)/i)
  if (minMatch) {
    conditions.push({ icon: "bag", label: `Min order ${minMatch[1]}` })
  } else {
    conditions.push({ icon: "bag", label: "No minimum" })
  }

  if (lower.includes("until") || lower.includes("valid until")) {
    conditions.push({ icon: "clock", label: "Limited time" })
  } else {
    conditions.push({ icon: "clock", label: "No expiry" })
  }

  if (lower.includes("online payment only")) {
    conditions.push({ icon: "card", label: "Online only" })
  } else if (lower.includes("cash on delivery only")) {
    conditions.push({ icon: "card", label: "COD only" })
  }

  const description =
    coupon.description ||
    (firstOrder
      ? "Discount applied at checkout on your first order."
      : "Discount applied at checkout on eligible items in your cart.")

  return {
    label: (coupon.name || coupon.code || "Coupon").toUpperCase(),
    discount: discountFromSummary(summary),
    badge: firstOrder ? "Popular" : null,
    subtitle: firstOrder ? "first order" : null,
    description,
    conditions,
    code: coupon.code,
  }
}

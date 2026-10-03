import { formatInr } from "@/module/payouts/lib/payout-format"

export function buildCouponEligibilitySummary(values, { cityName, targetLabels = [] } = {}) {
  const parts = []

  if (values.type === "flat" && values.valuePaise) {
    parts.push(`${formatInr(values.valuePaise)} off`)
  } else if (values.type === "percent" && values.percent) {
    let line = `${values.percent}% off`
    if (values.maxDiscountPaise) {
      line += ` (up to ${formatInr(values.maxDiscountPaise)})`
    }
    parts.push(line)
  }

  if (values.scope === "entire_cart") {
    parts.push("entire cart")
  } else if (values.scope === "products") {
    const names = targetLabels.map((t) => t.name)
    if (names.length === 1) parts.push(`product “${names[0]}”`)
    else if (names.length > 1) parts.push(`${names.length} selected products`)
    else parts.push("selected products")
  } else if (values.scope === "categories") {
    const names = targetLabels.map((t) => t.name)
    if (names.length === 1) parts.push(`“${names[0]}” category`)
    else if (names.length > 1) parts.push(`${names.length} categories`)
    else parts.push("selected categories")
  }

  if (cityName && cityName !== "all") {
    parts.push(`in ${cityName}`)
  }

  let summary = parts.join(" ")

  const conditions = []
  if (values.minOrderPaise > 0) {
    conditions.push(`Min order ${formatInr(values.minOrderPaise)}`)
  }
  if (values.firstOrderOnly) {
    conditions.push("First order only")
  }
  if (values.paymentOnline && !values.paymentCod) {
    conditions.push("Online payment only")
  } else if (values.paymentCod && !values.paymentOnline) {
    conditions.push("Cash on delivery only")
  }

  if (conditions.length) {
    summary += `. ${conditions.join(" · ")}`
  }

  return summary.trim()
}

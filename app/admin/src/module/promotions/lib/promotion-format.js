import { formatInr } from "@/module/payouts/lib/payout-format"

const DATE_OPTS = { day: "numeric", month: "short", year: "numeric" }

export function formatDiscount(coupon) {
  if (!coupon) return "—"
  if (coupon.type === "percent" && coupon.percentBps != null) {
    const percent = coupon.percentBps / 100
    const label = Number.isInteger(percent) ? String(percent) : percent.toFixed(1)
    return `${label}% off`
  }
  if (coupon.type === "flat" && coupon.valuePaise != null) {
    return `${formatInr(coupon.valuePaise)} off`
  }
  return "—"
}

export function formatUsage(coupon) {
  if (!coupon) return "—"
  const max = coupon.maxUses ?? "∞"
  return `${coupon.usedCount ?? 0} / ${max}`
}

export function formatValidity(coupon) {
  if (!coupon?.startsAt || !coupon?.endsAt) return "—"
  const start = new Date(coupon.startsAt).toLocaleDateString("en-IN", DATE_OPTS)
  const end = new Date(coupon.endsAt).toLocaleDateString("en-IN", DATE_OPTS)
  return `${start} – ${end}`
}

export function formatRedeemedAt(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    ...DATE_OPTS,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function computePromotionOverview(coupons, redemptions) {
  const activeCoupons = coupons.filter((c) => c.status === "active").length
  const totalRedemptions = redemptions.length

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const discountThisMonthPaise = redemptions
    .filter((r) => new Date(r.redeemedAt) >= monthStart)
    .reduce((sum, r) => sum + (r.discountPaise ?? 0), 0)

  const topCoupon = [...coupons].sort((a, b) => (b.usedCount ?? 0) - (a.usedCount ?? 0))[0]

  return {
    activeCoupons,
    totalRedemptions,
    discountThisMonthPaise,
    topCouponCode: topCoupon?.code ?? "—",
    topCouponUses: topCoupon?.usedCount ?? 0,
  }
}

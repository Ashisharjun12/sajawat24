export function couponRequiresCity(cart) {
  return !cart?.cityId
}

export function getCouponPaymentWarning(appliedCoupon, paymentMethod) {
  if (!appliedCoupon?.eligibilitySummary || !paymentMethod) return null

  const summary = appliedCoupon.eligibilitySummary.toLowerCase()

  if (summary.includes("online payment only") && paymentMethod === "cod") {
    return "This coupon works with online payment only. Switch to pay online or remove the coupon."
  }

  if (summary.includes("cash on delivery only") && paymentMethod === "online") {
    return "This coupon works with cash on delivery only. Switch to COD or remove the coupon."
  }

  return null
}

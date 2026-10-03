export function rupeesToPaise(rupees) {
  return Math.round(Number(rupees) * 100)
}

export function paiseToRupees(paise) {
  return Number(paise) / 100
}

export function formatPaise(paise) {
  return paiseToRupees(paise).toFixed(2)
}

export function rupeesInputValue(paise) {
  const rupees = paiseToRupees(paise)
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

export function parsePositivePaise(rupees) {
  if (rupees === "" || rupees == null) return null
  const paise = rupeesToPaise(rupees)
  if (!Number.isInteger(paise) || paise <= 0) return null
  return paise
}

export function parseNonNegativePaise(rupees) {
  if (rupees === "" || rupees == null) return 0
  const paise = rupeesToPaise(rupees)
  if (!Number.isInteger(paise) || paise < 0) return null
  return paise
}

export function defaultDiscountedRupees(regularRupees) {
  const paise = parsePositivePaise(regularRupees)
  if (paise == null) return ""
  return rupeesInputValue(Math.round(paise * 0.9))
}

export function toSellAndCompare(regularRupees, discountedRupees) {
  const regular = parsePositivePaise(regularRupees)
  const discounted = parsePositivePaise(discountedRupees)
  const pricePaise = discounted ?? regular
  if (pricePaise == null) {
    return { error: "Enter a sell price greater than 0" }
  }
  if (regular != null && regular < pricePaise) {
    return { error: "Discounted price cannot be more than regular price" }
  }
  return {
    pricePaise,
    compareAtPaise: regular != null && regular > pricePaise ? regular : null,
  }
}

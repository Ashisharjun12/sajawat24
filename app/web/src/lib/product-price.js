export function discountPercent(pricePaise, compareAtPaise) {
  if (compareAtPaise == null || compareAtPaise <= pricePaise) return 0;
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

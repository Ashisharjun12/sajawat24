export function discountPercent(pricePaise: number, compareAtPaise?: number | null): number {
  if (compareAtPaise == null || compareAtPaise <= pricePaise) return 0;
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

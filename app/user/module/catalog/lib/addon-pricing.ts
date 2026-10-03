export function isAddonAvailable(pricePaise: number | null | undefined): boolean {
  return pricePaise != null;
}

export function isAddonFree(pricePaise: number | null | undefined): boolean {
  return pricePaise === 0;
}

export function addonMaxQuantity(addon: { maxQuantity?: number }): number {
  const raw = addon?.maxQuantity ?? 1;
  return Math.min(20, Math.max(1, Number(raw) || 1));
}

export function addonDiscountPercent(
  pricePaise: number | null,
  compareAtPaise: number | null,
): number {
  if (compareAtPaise == null || pricePaise == null || compareAtPaise <= pricePaise) {
    return 0;
  }
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

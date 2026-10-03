/** Sell price resolved for the customer city (null = not available). */
export function isAddonAvailable(pricePaise) {
  return pricePaise != null;
}

export function isAddonFree(pricePaise) {
  return pricePaise === 0;
}

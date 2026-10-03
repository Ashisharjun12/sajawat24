export type CouponOffersFilter = 'all' | 'setup' | 'other';

export const COUPON_OFFERS_FILTER_OPTIONS: {
  value: CouponOffersFilter;
  label: string;
  productOnly?: boolean;
}[] = [
  { value: 'all', label: 'All offers' },
  { value: 'setup', label: 'For this setup', productOnly: true },
  { value: 'other', label: 'More offers', productOnly: true },
];

export function couponOffersFilterLabel(value: CouponOffersFilter): string {
  return COUPON_OFFERS_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? 'All offers';
}

export function filterCouponsByOffersFilter<T extends { appliesToProduct?: boolean }>(
  coupons: T[],
  filter: CouponOffersFilter,
): T[] {
  if (filter === 'setup') return coupons.filter((c) => c.appliesToProduct === true);
  if (filter === 'other') return coupons.filter((c) => c.appliesToProduct !== true);
  return coupons;
}

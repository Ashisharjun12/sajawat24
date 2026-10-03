import type { CouponLike } from '@/module/booking/lib/coupon-preview';

/** Prefer coupons that apply to this product; fall back to all city coupons. */
export function couponsForPdpDisplay(coupons: CouponLike[]): CouponLike[] {
  const forProduct = coupons.filter((c) => c.appliesToProduct);
  return forProduct.length > 0 ? forProduct : coupons;
}

export function resolveCouponCode(coupon: CouponLike): string {
  return String(coupon.code ?? '').trim();
}

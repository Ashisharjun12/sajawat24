/** Promo / coupon ticket icon — yellow badge (Flipkart-style offers). */
export const couponOfferIconBadgeClass =
  'bg-amber-100 dark:bg-amber-950/45';

export const couponOfferIconClass = 'text-amber-700 dark:text-amber-300';

import {
  orderSavingsBandClass,
  orderSavingsTextClass,
} from '@/lib/checkout-savings-styles';

/** Savings copy — Flipkart-style pale green band + emerald text (checkout parity). */
export const couponOfferSavingsTextClass = orderSavingsTextClass;

export const couponOfferSavingsBandClass = `mt-2 rounded-lg px-2.5 py-1.5 ${orderSavingsBandClass}`;

import { getApiError } from '@/api/client';

/**
 * Plain-language text for the messages the cart "apply coupon" API returns. The backend sends
 * message strings only (no error codes), so this matches on the text. Unknown messages fall back
 * to the server text so nothing is ever hidden behind a generic error.
 */
const COUPON_ERROR_RULES: { match: string; text: string }[] = [
  { match: 'invalid coupon code', text: "This coupon code doesn't exist. Check the spelling and try again." },
  { match: 'coupon is not active', text: 'This coupon is not active right now.' },
  { match: 'coupon is not valid yet', text: "This coupon isn't valid yet. Check back on its start date." },
  { match: 'coupon has expired', text: 'This coupon has expired.' },
  { match: 'not valid in this city', text: "This coupon isn't valid in your city." },
  { match: 'coupon is misconfigured', text: "This coupon can't be used right now." },
  { match: 'online payment only', text: 'This coupon works with online payment only.' },
  { match: 'cash on delivery only', text: 'This coupon works with cash on delivery only.' },
  { match: 'not valid for this payment method', text: "This coupon isn't valid for this payment method." },
  { match: 'usage limit reached', text: 'This coupon has reached its usage limit.' },
  { match: 'already used this coupon', text: "You've already used this coupon." },
  { match: 'first order only', text: 'This coupon is only for your first order.' },
  {
    match: 'minimum value for this coupon',
    text: "Your bag doesn't meet the minimum order value for this coupon.",
  },
  { match: 'does not apply to this cart', text: "This coupon doesn't apply to the items in your bag." },
  { match: 'select a city', text: 'Select a delivery address to apply coupons.' },
  { match: 'add items to your bag', text: 'Add items to your bag to apply a coupon.' },
  { match: 'too many coupon attempts', text: 'Too many attempts. Please wait a minute and try again.' },
  { match: 'rate limit exceeded', text: 'Too many attempts. Please wait a minute and try again.' },
  { match: 'validation failed', text: 'Enter a valid coupon code.' },
];

export function friendlyCouponError(err: unknown): string {
  const raw = getApiError(err);
  const lower = raw.toLowerCase();
  const rule = COUPON_ERROR_RULES.find((r) => lower.includes(r.match));
  return rule?.text ?? raw;
}

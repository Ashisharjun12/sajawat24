export type CouponConditionIcon = 'bag' | 'clock' | 'card' | 'pin';

export type CouponLike = {
  code?: string;
  name?: string;
  title?: string;
  description?: string;
  eligibilitySummary?: string;
  appliesToProduct?: boolean;
  discountLabel?: string;
};

export type CouponPreview = {
  label: string;
  discount: string;
  badge: string | null;
  subtitle: string | null;
  description: string;
  conditions: { icon: CouponConditionIcon; label: string }[];
  code: string | undefined;
};

function discountFromSummary(summary: string) {
  if (!summary) return 'Discount';
  const match = summary.match(/^(.+?\s+off(?:\s+\(up to[^)]+\))?)/i);
  if (match) return match[1];
  return summary.split('.')[0] || 'Discount';
}

export function buildCouponPreviewFromApplied(coupon: CouponLike | null | undefined): CouponPreview | null {
  if (!coupon) return null;

  const summary = coupon.eligibilitySummary ?? '';
  const lower = summary.toLowerCase();
  const firstOrder = lower.includes('first order');

  const conditions: { icon: CouponConditionIcon; label: string }[] = [];
  const minMatch = summary.match(/Min order (₹[\d,]+)/i);
  if (minMatch) {
    conditions.push({ icon: 'bag', label: `Min order ${minMatch[1]}` });
  } else {
    conditions.push({ icon: 'bag', label: 'No minimum' });
  }

  if (lower.includes('until') || lower.includes('valid until')) {
    conditions.push({ icon: 'clock', label: 'Limited time' });
  } else {
    conditions.push({ icon: 'clock', label: 'No expiry' });
  }

  if (lower.includes('online payment only')) {
    conditions.push({ icon: 'card', label: 'Online only' });
  } else if (lower.includes('cash on delivery only')) {
    conditions.push({ icon: 'card', label: 'COD only' });
  }

  const description =
    coupon.description ||
    (firstOrder
      ? 'Discount applied at checkout on your first order.'
      : 'Discount applied at checkout on eligible items in your cart.');

  const discountRaw = String(coupon.discountLabel ?? '').trim();
  const discount = discountRaw || discountFromSummary(summary);

  return {
    label: (coupon.name || coupon.title || coupon.code || 'Coupon').toUpperCase(),
    discount,
    badge: firstOrder ? 'Popular' : null,
    subtitle: firstOrder ? 'first order' : null,
    description,
    conditions,
    code: coupon.code ? String(coupon.code) : undefined,
  };
}

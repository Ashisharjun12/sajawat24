import type { CouponLike } from '@/module/booking/lib/coupon-preview';

export type CartAddonLine = {
  id: string;
  name: string;
  quantity: number;
  pricePaise: number | null;
  imageUrl?: string | null;
};

export type CartItemLine = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  /** Product-only unit price (excludes add-ons). */
  productPaise?: number;
  /** Add-on portion of one unit. */
  addonsPaise?: number;
  /** Product + add-ons for the whole line. */
  lineTotalPaise: number;
  imageUrl?: string | null;
  addons?: CartAddonLine[];
  paymentCod?: boolean;
  paymentOnline?: boolean;
};

export type CartSnapshot = {
  id: string | null;
  cityId: string | null;
  pincode: string | null;
  scheduledAt: string | null;
  fulfillmentType?: 'instant' | 'scheduled' | string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  appliedCoupon: CouponLike | null;
  items: CartItemLine[];
};

export const emptyCart: CartSnapshot = {
  id: null,
  cityId: null,
  pincode: null,
  scheduledAt: null,
  fulfillmentType: null,
  deliveryLatitude: null,
  deliveryLongitude: null,
  itemCount: 0,
  subtotalPaise: 0,
  discountPaise: 0,
  totalPaise: 0,
  appliedCoupon: null,
  items: [],
};

export function normalizeCart(raw: unknown): CartSnapshot {
  if (!raw || typeof raw !== 'object') return emptyCart;
  const c = raw as Record<string, unknown>;
  const rawItems = Array.isArray(c.items) ? (c.items as CartItemLine[]) : [];
  const items = rawItems.map((rawItem) => {
    const row = rawItem as CartItemLine & { image_url?: string | null };
    const imageUrl =
      (typeof row.imageUrl === 'string' && row.imageUrl.trim()) ||
      (typeof row.image_url === 'string' && row.image_url.trim()) ||
      null;
    const addons = (row.addons ?? [])
      .filter((a) => (a.quantity ?? 0) > 0)
      .map((addon) => {
        const a = addon as CartAddonLine & { image_url?: string | null };
        const addonImage =
          (typeof a.imageUrl === 'string' && a.imageUrl.trim()) ||
          (typeof a.image_url === 'string' && a.image_url.trim()) ||
          null;
        return { ...a, imageUrl: addonImage ?? a.imageUrl ?? null };
      });
    const base = {
      ...row,
      imageUrl: imageUrl ?? row.imageUrl ?? null,
      productPaise: Number(row.productPaise) || 0,
      addonsPaise: Number(row.addonsPaise) || 0,
    };
    return addons.length ? { ...base, addons } : { ...base, addons: undefined };
  });
  return {
    id: (c.id as string) ?? null,
    cityId: (c.cityId as string) ?? null,
    pincode: c.pincode != null ? String(c.pincode) : null,
    scheduledAt: (c.scheduledAt as string) ?? null,
    fulfillmentType: (c.fulfillmentType as string) ?? null,
    deliveryLatitude: c.deliveryLatitude as number | null | undefined ?? null,
    deliveryLongitude: c.deliveryLongitude as number | null | undefined ?? null,
    itemCount: Number(c.itemCount) || items.length,
    subtotalPaise: Number(c.subtotalPaise) || 0,
    discountPaise: Number(c.discountPaise) || 0,
    totalPaise: Number(c.totalPaise) || Number(c.subtotalPaise) || 0,
    appliedCoupon: (c.appliedCoupon as CouponLike) ?? null,
    items,
  };
}

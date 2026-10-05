import type { CartAddonLine, CartItemLine, CartSnapshot } from '@/module/booking/lib/cart-types';
import { addonImageUrl, type PublicAddonForCity } from '@/module/catalog/lib/product-detail';

export function cartLineQtyById(item: CartItemLine): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of item.addons ?? []) {
    if ((row.quantity ?? 0) > 0) map[row.id] = row.quantity;
  }
  return map;
}

export function addonSelectionsFromQty(qtyById: Record<string, number>) {
  return Object.entries(qtyById)
    .filter(([, q]) => q > 0)
    .map(([addonId, quantity]) => ({ addonId, quantity }));
}

export function patchCartLineAddonQty(
  cart: CartSnapshot,
  lineId: string,
  nextQtyById: Record<string, number>,
  catalog?: PublicAddonForCity[],
): CartSnapshot {
  const catalogById = new Map((catalog ?? []).map((a) => [a.id, a]));

  const items = cart.items.map((line) => {
    if (line.id !== lineId) return line;
    const prevAddons = line.addons ?? [];
    const addons: CartAddonLine[] = [];

    for (const [id, qty] of Object.entries(nextQtyById)) {
      if (qty <= 0) continue;
      const existing = prevAddons.find((a) => a.id === id);
      const cat = catalogById.get(id);
      if (existing) {
        addons.push({ ...existing, quantity: qty });
      } else if (cat) {
        addons.push({
          id,
          name: cat.name,
          quantity: qty,
          pricePaise: cat.pricePaise ?? null,
          imageUrl: addonImageUrl(cat) ?? null,
        });
      }
    }

    return { ...line, addons: addons.length ? addons : undefined };
  });

  return { ...cart, items };
}

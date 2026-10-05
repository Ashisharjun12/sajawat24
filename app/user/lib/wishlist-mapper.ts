import type { WishlistApiItem } from '@/api/wishlist.api';
import type { WishlistEntry } from '@/lib/wishlist-storage';
import type { HomeCatalogProduct, HomeProductInstant } from '@/module/home/lib/home-catalog';

export type WishlistRow = {
  productId: string;
  addedAt: number;
  available: boolean;
  unavailableReason?: WishlistApiItem['unavailableReason'];
  product: HomeCatalogProduct | null;
};

function parseInstant(raw: unknown): HomeProductInstant | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.enabled !== true) return null;
  return {
    enabled: true,
    showBadge: o.showBadge === true,
    badgeLabel: typeof o.badgeLabel === 'string' ? o.badgeLabel : 'Instant',
    pdpNote: typeof o.pdpNote === 'string' ? o.pdpNote : null,
    etaMinutes: typeof o.etaMinutes === 'number' ? o.etaMinutes : null,
  };
}

export function apiItemToRow(item: WishlistApiItem): WishlistRow {
  const product = item.product;
  return {
    productId: item.productId,
    addedAt: Date.parse(item.addedAt) || Date.now(),
    available: item.available,
    unavailableReason: item.unavailableReason,
    product: product
      ? {
          id: product.id,
          title: product.title ?? product.name,
          imageUrl: product.imageUrl,
          pricePaise: product.pricePaise,
          compareAtPaise: product.compareAtPaise,
          rating: product.ratingAvg != null ? Number(product.ratingAvg) : null,
          reviewCount: product.reviewCount ?? null,
          instant: parseInstant(product.instant),
        }
      : null,
  };
}

export function localEntryToRow(entry: WishlistEntry): WishlistRow {
  return {
    productId: entry.productId,
    addedAt: entry.addedAt,
    available: true,
    product: {
      id: entry.productId,
      title: entry.title,
      imageUrl: entry.imageUrl,
      pricePaise: entry.pricePaise,
      compareAtPaise: entry.compareAtPaise ?? null,
      rating: null,
      reviewCount: null,
      instant: null,
    },
  };
}

export function rowToLocalEntry(row: WishlistRow): WishlistEntry | null {
  if (!row.product) return null;
  return {
    productId: row.productId,
    title: row.product.title,
    imageUrl: row.product.imageUrl,
    pricePaise: row.product.pricePaise,
    compareAtPaise: row.product.compareAtPaise,
    addedAt: row.addedAt,
  };
}

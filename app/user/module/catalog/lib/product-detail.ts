export type ProductImagePublic = {
  url?: string;
  publicUrl?: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  kind?: string;
};

export type ProductFaq = { question?: string; answer?: string; key?: string };

export type PublicInstantInfo = {
  enabled?: boolean;
  showBadge?: boolean;
  badgeLabel?: string | null;
  pdpNote?: string | null;
  etaMinutes?: number | null;
};

export type PublicAddonForCity = {
  id: string;
  name: string;
  slug?: string;
  image?: ProductImagePublic | null;
  color?: { id: string; name: string; slug: string; hex: string } | null;
  pricePaise: number | null;
  compareAtPaise: number | null;
  maxQuantity: number;
};

export type CatalogProductDetail = {
  id: string;
  name: string;
  description?: string | null;
  categoryId?: string;
  pricePaise: number;
  compareAtPaise?: number | null;
  ratingAvg?: number | string | null;
  reviewCount?: number | null;
  scheduledEnabled?: boolean;
  instantEnabled?: boolean;
  images: ProductImagePublic[];
  includes?: string[];
  deliverySetup?: string[];
  careInstructions?: string[];
  faqs?: ProductFaq[];
  addons: PublicAddonForCity[];
  instant: PublicInstantInfo | null;
  city?: { id: string; name: string };
};

export function productImageUrl(item: ProductImagePublic | null | undefined): string {
  if (!item) return '';
  return (
    item.url ||
    item.publicUrl ||
    item.optimizedUrl ||
    item.thumbnailUrl ||
    ''
  );
}

export function productImageUrls(images: ProductImagePublic[] | undefined): string[] {
  return (images ?? [])
    .filter((item) => item.kind !== 'video')
    .map(productImageUrl)
    .filter(Boolean);
}

export function filledStringList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => String(item).trim()).filter(Boolean);
}

export function filledFaqs(items: ProductFaq[] | undefined): ProductFaq[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) => (item.question ?? '').trim() && (item.answer ?? '').trim(),
  );
}

export function parseRatingAvg(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function addonImageUrl(addon: PublicAddonForCity): string {
  return productImageUrl(addon.image ?? undefined);
}

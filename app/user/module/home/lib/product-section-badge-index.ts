import type { HomeProductSection } from '@/module/home/lib/home-catalog';

export type ProductSectionBadgeEntry = {
  badgeLabel: string;
  badgeColor: string;
};

/**
 * Maps product id → merchandising section badge (one section per product in admin).
 */
export function buildProductSectionBadgeIndex(
  sections: HomeProductSection[],
): Map<string, ProductSectionBadgeEntry> {
  const map = new Map<string, ProductSectionBadgeEntry>();

  if (!Array.isArray(sections)) return map;

  for (const section of sections) {
    const badgeLabel = (section.badgeLabel ?? section.title ?? '').trim();
    const badgeColor = section.badgeColor ?? 'amber';
    if (!badgeLabel) continue;

    for (const product of section.items ?? []) {
      const id = product?.id;
      if (!id || map.has(id)) continue;
      map.set(id, { badgeLabel, badgeColor });
    }
  }

  return map;
}

/** Cheap equality check before rebuilding merch index on refetch. */
export function buildSectionsSignature(sections: HomeProductSection[]): string {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  return sections
    .map((section) => {
      const ids = (section.items ?? []).map((p) => p.id).join(',');
      return `${section.id}|${section.badgeLabel ?? ''}|${section.badgeColor ?? ''}|${ids}`;
    })
    .join(';');
}

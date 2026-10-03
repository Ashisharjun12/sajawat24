/**
 * Maps product id → merchandising section badge (one section per product in admin).
 */
export function buildProductSectionBadgeIndex(sections) {
  const map = new Map();

  if (!Array.isArray(sections)) return map;

  for (const section of sections) {
    const badgeLabel = (section.badgeLabel ?? section.name ?? "").trim();
    const badgeColor = section.badgeColor ?? "amber";
    if (!badgeLabel) continue;

    for (const product of section.items ?? []) {
      const id = product?.id;
      if (!id || map.has(id)) continue;
      map.set(id, { badgeLabel, badgeColor });
    }
  }

  return map;
}

export function parseSubcategoryIdsParam(searchParams) {
  const raw = searchParams.get("subcategoryIds");
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function resolveCategoryListingIds({
  routeCategoryIds,
  childRouteActive,
  subcategoryIds,
  parentChildIds,
}) {
  if (!routeCategoryIds?.length) return [];
  if (childRouteActive) return routeCategoryIds;
  if (!subcategoryIds?.length) return routeCategoryIds;
  const allowed = new Set(parentChildIds ?? []);
  const filtered = subcategoryIds.filter((id) => allowed.has(id));
  return filtered.length ? filtered : routeCategoryIds;
}

export function countActiveListingFilters({
  sort,
  minPriceRupees,
  maxPriceRupees,
  subcategoryIds,
  defaultSort,
}) {
  let count = 0;
  if (sort && sort !== defaultSort) count += 1;
  if (minPriceRupees != null || maxPriceRupees != null) count += 1;
  if (subcategoryIds?.length) count += 1;
  return count;
}

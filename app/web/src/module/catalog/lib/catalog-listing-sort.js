export const CATALOG_SORT_DEFAULT = "popularity";

export const CATALOG_SORT_OPTIONS = [
  { id: "popularity", label: "Popularity" },
  { id: "new", label: "New Arrivals" },
  { id: "price_asc", label: "Low to High" },
  { id: "price_desc", label: "High to Low" },
];

export function parseCatalogSort(value) {
  const found = CATALOG_SORT_OPTIONS.some((opt) => opt.id === value);
  return found ? value : CATALOG_SORT_DEFAULT;
}

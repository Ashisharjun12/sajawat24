import { categoryProductIds } from "@/module/catalog/lib/category-nav";

/**
 * Flatten catalog tree into searchable occasion + subcategory rows.
 * @param {Array} categories
 */
export function buildCategorySearchIndex(categories) {
  if (!Array.isArray(categories)) return [];

  const hits = [];
  for (const parent of categories) {
    if (!parent?.id) continue;
    hits.push({
      id: parent.id,
      parent,
      child: null,
      label: parent.name,
      searchHaystack: parent.name.toLowerCase(),
    });
    for (const child of parent.children ?? []) {
      if (!child?.id) continue;
      hits.push({
        id: `${parent.id}:${child.id}`,
        parent,
        child,
        label: child.name,
        searchHaystack: `${parent.name} ${child.name}`.toLowerCase(),
      });
    }
  }
  return hits;
}

function matchScore(hit, q) {
  const label = hit.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (hit.searchHaystack.includes(q)) return 40;
  return 0;
}

/**
 * @param {ReturnType<typeof buildCategorySearchIndex>} hits
 * @param {string} query
 * @param {{ limit?: number }} options
 */
/** Category UUIDs for product list when search matches occasions / subcategories. */
export function categoryIdsForSearchHits(hits, { maxHits = 3 } = {}) {
  const ids = new Set();
  for (const hit of hits.slice(0, maxHits)) {
    for (const id of categoryProductIds({
      parent: hit.parent,
      child: hit.child,
    })) {
      ids.add(id);
    }
  }
  return [...ids];
}

/** When the query matches occasion/subcategory names, load products by category (not only name `q`). */
export function preferCategoryProductFilter(hits, query) {
  const q = query.trim().toLowerCase();
  if (!q || !hits.length) return false;
  return hits.some((hit) => matchScore(hit, q) >= 60);
}

export function filterCategorySearchHits(hits, query, { limit = 5 } = {}) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return hits
      .filter((hit) => !hit.child)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, limit);
  }

  return hits
    .map((hit) => ({ hit, score: matchScore(hit, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.label.localeCompare(b.hit.label))
    .map((row) => row.hit)
    .slice(0, limit);
}

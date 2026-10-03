import { categoryPath } from "@/lib/catalog-path";

/**
 * Resolve category routes from the public catalog tree (top-level nodes with `children`).
 */
export function findCategoryBySlugs(categories, parentSlug, childSlug) {
  if (!parentSlug || !Array.isArray(categories)) {
    return { parent: null, child: null };
  }
  const parent = categories.find((row) => row.slug === parentSlug) ?? null;
  if (!parent) {
    return { parent: null, child: null };
  }
  if (!childSlug) {
    return { parent, child: null };
  }
  const child = (parent.children ?? []).find((row) => row.slug === childSlug) ?? null;
  return { parent, child };
}

/** UUIDs for `listProducts({ categoryIds })` — rollup on parent when subcategories exist. */
export function categoryProductIds({ parent, child }) {
  if (!parent?.id) return [];
  if (child?.id) return [child.id];
  const children = parent.children ?? [];
  if (children.length === 0) return [parent.id];
  return [parent.id, ...children.map((row) => row.id)];
}

export function isCategoryRouteValid({ parent, childSlug, child }) {
  if (!parent) return false;
  if (childSlug && !child) return false;
  return true;
}

/** Home “View all” → first row category that exists in the catalog tree (e.g. `/c/birthday`). */
export function resolveViewAllCategoryHref({
  rowCategories = [],
  catalogCategories = [],
  currentParent = null,
} = {}) {
  const tree =
    catalogCategories.length > 0 ? catalogCategories : rowCategories;

  if (currentParent?.slug) {
    const parent =
      tree.find((row) => row.slug === currentParent.slug) ?? currentParent;
    return parent?.slug ? categoryPath(parent) : null;
  }

  const ordered = rowCategories.length > 0 ? rowCategories : tree;
  for (const cat of ordered) {
    if (!cat?.slug) continue;
    const match = tree.find((row) => row.slug === cat.slug);
    if (match) return categoryPath(match);
  }

  const first = tree[0];
  return first?.slug ? categoryPath(first) : null;
}

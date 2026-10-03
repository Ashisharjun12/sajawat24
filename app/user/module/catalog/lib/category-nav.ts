import type { Href } from 'expo-router';

import type { HomeCategory } from '@/module/home/lib/home-catalog';

function categoryPath(category: HomeCategory, child?: HomeCategory | null): Href {
  if (child?.slug) {
    return `/(app)/category?parentSlug=${encodeURIComponent(category.slug)}&childSlug=${encodeURIComponent(child.slug)}` as Href;
  }
  return `/(app)/category?parentSlug=${encodeURIComponent(category.slug)}` as Href;
}

export function findCategoryBySlugs(
  categories: HomeCategory[],
  parentSlug: string | undefined,
  childSlug?: string | undefined,
): { parent: HomeCategory | null; child: HomeCategory | null } {
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

export function isCategoryRouteValid({
  parent,
  childSlug,
  child,
}: {
  parent: HomeCategory | null;
  childSlug?: string;
  child: HomeCategory | null;
}): boolean {
  if (!parent) return false;
  if (childSlug && !child) return false;
  return true;
}

/** UUIDs for `listProducts({ categoryIds })` — rollup on parent when subcategories exist. */
export function categoryProductIds({
  parent,
  child,
}: {
  parent: HomeCategory | null;
  child?: HomeCategory | null;
}): string[] {
  if (!parent?.id) return [];
  if (child?.id) return [child.id];
  const children = parent.children ?? [];
  if (children.length === 0) return [parent.id];
  return [parent.id, ...children.map((row) => row.id)];
}

/** Home “View all” → first row category that exists in the catalog tree. */
export function resolveViewAllCategoryHref({
  rowCategories = [],
  catalogCategories = [],
  currentParent = null,
}: {
  rowCategories?: HomeCategory[];
  catalogCategories?: HomeCategory[];
  currentParent?: HomeCategory | null;
} = {}): Href | null {
  const tree = catalogCategories.length > 0 ? catalogCategories : rowCategories;

  if (currentParent?.slug) {
    const parent = tree.find((row) => row.slug === currentParent.slug) ?? currentParent;
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

import type { Href } from 'expo-router';

import { resolveProductCategory } from '@/module/catalog/lib/product-breadcrumb';
import { normalizeCategoryTree, type HomeCategory } from '@/module/home/lib/home-catalog';

export const CATEGORY_TAB_ROOT_HREF = '/(app)/category' as Href;

export const EXPLORE_OTHER_RAIL_COPY = {
  title: 'Explore other categories',
  subtitle: 'Popular packages from other setups',
  viewAllHref: '/(app)/explore' as Href,
  viewAllLabel: 'View all',
};

export function getCategoryListingHref(
  categoryId: string,
  rawCategories: HomeCategory[],
): Href {
  const categories = normalizeCategoryTree(rawCategories);
  const resolved = resolveProductCategory(categoryId, categories);
  if (resolved.childSlug && resolved.parentSlug) {
    return `/(app)/category?parentSlug=${encodeURIComponent(resolved.parentSlug)}&childSlug=${encodeURIComponent(resolved.childSlug)}` as Href;
  }
  if (resolved.parentSlug) {
    return `/(app)/category?parentSlug=${encodeURIComponent(resolved.parentSlug)}` as Href;
  }
  return CATEGORY_TAB_ROOT_HREF;
}

export function resolveRailViewAllHref(
  items: { categoryId?: string | null }[],
  categories: HomeCategory[],
): Href {
  const first = items.find((product) => product?.categoryId);
  if (first?.categoryId) {
    return getCategoryListingHref(first.categoryId, categories);
  }
  return CATEGORY_TAB_ROOT_HREF;
}

export type SimilarPackagesMeta = {
  categoryIds: string[];
  categoryLabel: string;
  viewAllHref: Href;
  viewAllLabel: string;
};

function indexCategories(categories: HomeCategory[]) {
  const byId = new Map<string, HomeCategory>();
  function walk(nodes: HomeCategory[]) {
    for (const node of nodes ?? []) {
      byId.set(node.id, node);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(categories);
  return byId;
}

/** PDP “Similar” sheet — category scope, pill label, and view-all CTA (web parity). */
export function resolveSimilarPackagesMeta(
  categoryId: string | null | undefined,
  rawCategories: HomeCategory[],
): SimilarPackagesMeta | null {
  if (!categoryId) return null;

  const categories = normalizeCategoryTree(rawCategories);
  const byId = indexCategories(categories);
  const cat = byId.get(categoryId);
  if (!cat) return null;

  const parent = cat.parentId ? byId.get(cat.parentId) : null;
  const listingName = (parent?.name ?? cat.name ?? '').trim() || 'Decorations';

  return {
    categoryIds: [categoryId],
    categoryLabel: (cat.name ?? '').trim() || 'Packages',
    viewAllHref: getCategoryListingHref(categoryId, rawCategories),
    viewAllLabel: `View all in ${listingName}`,
  };
}

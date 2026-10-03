import { categoryPath } from "@/lib/catalog-path";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";

export function indexCategories(categories) {
  const byId = new Map();
  function walk(nodes) {
    for (const node of nodes ?? []) {
      byId.set(node.id, node);
      walk(node.children);
    }
  }
  walk(categories);
  return byId;
}

export function getCategoryListingHref(categoryId, rawCategories) {
  const categories = normalizeCategoryTree(rawCategories);
  const byId = indexCategories(categories);
  const cat = byId.get(categoryId);
  if (!cat) return "/decorations";
  if (cat.parentId) {
    const parent = byId.get(cat.parentId);
    if (parent) return categoryPath(parent, cat);
  }
  return categoryPath(cat);
}

export function resolveSubcategoryRailContext(categoryId, rawCategories) {
  const categories = normalizeCategoryTree(rawCategories);
  const byId = indexCategories(categories);

  if (!categoryId) {
    return {
      mode: "top-level",
      parent: null,
      currentSubcategory: null,
      railCategories: [],
    };
  }

  const cat = byId.get(categoryId);
  if (!cat) {
    return {
      mode: "top-level",
      parent: null,
      currentSubcategory: null,
      railCategories: [],
    };
  }

  if (!cat.parentId) {
    return {
      mode: "top-level",
      parent: null,
      currentSubcategory: cat,
      railCategories: [cat],
    };
  }

  const parent = byId.get(cat.parentId);
  if (!parent) {
    return {
      mode: "top-level",
      parent: null,
      currentSubcategory: cat,
      railCategories: [cat],
    };
  }

  const siblings = (parent.children ?? []).filter(Boolean);
  const ordered = [];
  const seen = new Set();

  ordered.push(cat);
  seen.add(cat.id);

  for (const sibling of siblings) {
    if (!seen.has(sibling.id)) {
      ordered.push(sibling);
      seen.add(sibling.id);
    }
  }

  return {
    mode: "subcategory",
    parent,
    currentSubcategory: cat,
    railCategories: ordered,
  };
}

export function getSubcategoryRailCopy(subcategory, parent) {
  const name = (subcategory?.name ?? "").trim() || "Packages";
  const parentName = (parent?.name ?? "").trim();
  return {
    title: `${name} packages`,
    subtitle: parentName || undefined,
    ariaLabel: `${name} packages`,
  };
}

export const TOP_LEVEL_SIMILAR_RAIL_COPY = {
  title: "Similar packages",
  subtitle: "More setups like this one",
  ariaLabel: "Similar packages",
};

/** PDP “Similar” sheet — category scope, pill label, and view-all CTA. */
export function resolveSimilarPackagesMeta(categoryId, rawCategories) {
  if (!categoryId) return null;

  const categories = normalizeCategoryTree(rawCategories);
  const byId = indexCategories(categories);
  const cat = byId.get(categoryId);
  if (!cat) return null;

  const parent = cat.parentId ? byId.get(cat.parentId) : null;
  const listingName = (parent?.name ?? cat.name ?? "").trim() || "Decorations";

  return {
    categoryIds: [categoryId],
    categoryLabel: (cat.name ?? "").trim() || "Packages",
    viewAllHref: getCategoryListingHref(categoryId, rawCategories),
    viewAllLabel: `View all in ${listingName}`,
  };
}

export const EXPLORE_OTHER_RAIL_COPY = {
  title: "Explore other categories",
  subtitle: "Popular packages from other setups",
  ariaLabel: "Explore other categories",
  viewAllHref: "/decorations",
};

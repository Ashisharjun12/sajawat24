import { categoryProductIds } from "@/module/catalog/lib/category-nav";

export function flattenCategoriesForFilter(categories, depth = 0) {
  if (!Array.isArray(categories)) return [];
  const rows = [];
  for (const category of categories) {
    if (!category?.id) continue;
    rows.push({
      id: category.id,
      name: category.name,
      depth,
    });
    if (category.children?.length) {
      rows.push(...flattenCategoriesForFilter(category.children, depth + 1));
    }
  }
  return rows;
}

export function parseCategoryIdsParam(searchParams) {
  const multi = searchParams.get("categoryIds")?.trim();
  if (multi) {
    return multi.split(",").map((id) => id.trim()).filter(Boolean);
  }
  const single = searchParams.get("categoryId")?.trim();
  return single ? [single] : [];
}

export function resolveExploreProductCategoryIds(categories, selectedIds) {
  if (!selectedIds?.length) return undefined;

  const out = new Set();

  function walk(nodes, parent = null) {
    for (const node of nodes ?? []) {
      if (selectedIds.includes(node.id)) {
        const ids = parent
          ? categoryProductIds({ parent, child: node })
          : categoryProductIds({ parent: node, child: null });
        ids.forEach((id) => out.add(id));
      }
      walk(node.children, node);
    }
  }

  walk(categories);

  if (out.size === 0) {
    selectedIds.forEach((id) => out.add(id));
  }

  return [...out];
}

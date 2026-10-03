import { categoryProductIds } from '@/module/catalog/lib/category-nav';
import type { HomeCategory } from '@/module/home/lib/home-catalog';

export function flattenCategoriesForFilter(categories: HomeCategory[], depth = 0) {
  if (!Array.isArray(categories)) return [];
  const rows: { id: string; name: string; depth: number }[] = [];
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

export function parseExploreCategoryIds(params: {
  categoryId?: string | string[];
  categoryIds?: string | string[];
}): string[] {
  const multiRaw = params.categoryIds;
  const multi =
    typeof multiRaw === 'string'
      ? multiRaw.trim()
      : Array.isArray(multiRaw)
        ? multiRaw.join(',')
        : '';
  if (multi) {
    return multi.split(',').map((id) => id.trim()).filter(Boolean);
  }
  const singleRaw = params.categoryId;
  const single =
    typeof singleRaw === 'string'
      ? singleRaw.trim()
      : Array.isArray(singleRaw)
        ? singleRaw[0]?.trim()
        : '';
  return single ? [single] : [];
}

export function resolveExploreProductCategoryIds(
  categories: HomeCategory[],
  selectedIds: string[],
): string[] | undefined {
  if (!selectedIds?.length) return undefined;

  const out = new Set<string>();

  function walk(nodes: HomeCategory[], parent: HomeCategory | null = null) {
    for (const node of nodes ?? []) {
      if (selectedIds.includes(node.id)) {
        const ids = parent
          ? categoryProductIds({ parent, child: node })
          : categoryProductIds({ parent: node, child: null });
        ids.forEach((id) => out.add(id));
      }
      walk(node.children ?? [], node);
    }
  }

  walk(categories);

  if (out.size === 0) {
    selectedIds.forEach((id) => out.add(id));
  }

  return [...out];
}

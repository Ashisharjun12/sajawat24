import type { HomeCategory } from '@/module/home/lib/home-catalog';

export type ProductBreadcrumbCategory = {
  label: string;
  parentSlug?: string;
  childSlug?: string;
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

export function resolveProductCategory(
  categoryId: string | null | undefined,
  categories: HomeCategory[],
): ProductBreadcrumbCategory {
  if (!categoryId) return { label: 'Decorations' };
  const byId = indexCategories(categories);
  const cat = byId.get(categoryId);
  if (!cat) return { label: 'Decorations' };

  for (const parent of categories) {
    const child = (parent.children ?? []).find((c) => c.id === categoryId);
    if (child) {
      return { label: child.name, parentSlug: parent.slug, childSlug: child.slug };
    }
  }
  return { label: cat.name, parentSlug: cat.slug };
}

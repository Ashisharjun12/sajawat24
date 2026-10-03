import { categoryProductIds } from '@/module/catalog/lib/category-nav';
import {
  isPlaceholderCategoryName,
  type HomeCategory,
} from '@/module/home/lib/home-catalog';

export type CategorySearchHit = {
  id: string;
  parent: HomeCategory;
  child: HomeCategory | null;
  label: string;
  searchHaystack: string;
};

export function buildCategorySearchIndex(categories: HomeCategory[]): CategorySearchHit[] {
  if (!Array.isArray(categories)) return [];

  const hits: CategorySearchHit[] = [];
  for (const parent of categories) {
    if (!parent?.id || isPlaceholderCategoryName(parent.name)) continue;
    hits.push({
      id: parent.id,
      parent,
      child: null,
      label: parent.name,
      searchHaystack: parent.name.toLowerCase(),
    });
    for (const child of parent.children ?? []) {
      if (!child?.id || isPlaceholderCategoryName(child.name)) continue;
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

function matchScore(hit: CategorySearchHit, q: string): number {
  const label = hit.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (hit.searchHaystack.includes(q)) return 40;
  return 0;
}

export function categoryIdsForSearchHits(
  hits: CategorySearchHit[],
  { maxHits = 3 }: { maxHits?: number } = {},
): string[] {
  const ids = new Set<string>();
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

export function preferCategoryProductFilter(hits: CategorySearchHit[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q || !hits.length) return false;
  return hits.some((hit) => matchScore(hit, q) >= 60);
}

export function filterCategorySearchHits(
  hits: CategorySearchHit[],
  query: string,
  { limit = 5 }: { limit?: number } = {},
): CategorySearchHit[] {
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

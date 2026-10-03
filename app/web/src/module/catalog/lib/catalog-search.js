import { DEMO_BUDGETS } from "@/module/home/data/demo-categories";
import {
  categoryProductIds,
  findCategoryBySlugs,
} from "@/module/catalog/lib/category-nav";

export const SEARCH_EVENT_DATE_KEY = "decory-search-scheduled-at";

export function budgetToPriceRange(budgetValue) {
  switch (budgetValue) {
    case "under-3k":
      return { minPriceRupees: null, maxPriceRupees: 3000 };
    case "3k-6k":
      return { minPriceRupees: 3000, maxPriceRupees: 6000 };
    case "6k-plus":
      return { minPriceRupees: 6000, maxPriceRupees: null };
    default:
      return { minPriceRupees: null, maxPriceRupees: null };
  }
}

export function budgetLabel(budgetValue) {
  return DEMO_BUDGETS.find((item) => item.value === budgetValue)?.label ?? null;
}

/** @param {Array} categories normalized catalog tree */
export function resolveOccasionCategoryIds(categories, occasionSlug) {
  if (!occasionSlug?.trim() || !Array.isArray(categories)) return { ids: [], parent: null };
  const { parent } = findCategoryBySlugs(categories, occasionSlug, undefined);
  if (!parent) return { ids: [], parent: null };
  return {
    ids: categoryProductIds({ parent, child: null }),
    parent,
  };
}

export function buildDecorationsSearchUrl({ occasion, budget = "any", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (occasion?.trim()) {
    params.set("occasion", occasion.trim());
  }
  const { minPriceRupees, maxPriceRupees } = budgetToPriceRange(budget);
  if (minPriceRupees != null) {
    params.set("minPrice", String(minPriceRupees));
  }
  if (maxPriceRupees != null) {
    params.set("maxPrice", String(maxPriceRupees));
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `/decorations?${query}` : "/decorations";
}

export function persistSearchEventDate(date) {
  if (!date) {
    try {
      sessionStorage.removeItem(SEARCH_EVENT_DATE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    sessionStorage.setItem(SEARCH_EVENT_DATE_KEY, date.toISOString());
  } catch {
    /* ignore */
  }
}

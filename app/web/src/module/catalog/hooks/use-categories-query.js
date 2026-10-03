import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/api/categories.api";
import { queryKeys } from "@/lib/query-keys";

const CATEGORIES_STALE_MS = 15 * 60_000;

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => listCategories(),
    staleTime: CATEGORIES_STALE_MS,
    select: (data) => (Array.isArray(data) ? data : []),
  });
}

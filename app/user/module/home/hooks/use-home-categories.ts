import { listCategories } from '@/api/categories.api';
import { queryKeys } from '@/lib/query-keys';
import { normalizeCategoryTree } from '@/module/home/lib/home-catalog';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';

type UseHomeCategoriesOptions = {
  /** Catalog categories are global — fetch without waiting for delivery location. */
  requireLocation?: boolean;
};

export function useHomeCategories(options: UseHomeCategoriesOptions = {}) {
  const { requireLocation = false } = options;
  const status = useLocationStore((s) => s.status);
  const enabled = requireLocation ? status === 'ready' : true;

  const query = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const data = await listCategories();
      const items = Array.isArray(data) ? data : (data as { items?: unknown[] })?.items ?? [];
      return normalizeCategoryTree(items);
    },
    enabled,
    staleTime: 15 * 60_000,
    placeholderData: (previous) => previous,
  });

  return {
    categories: query.data ?? [],
    isPending: enabled && query.isPending,
    isRefetching: enabled && query.isRefetching,
    refetch: query.refetch,
  };
}

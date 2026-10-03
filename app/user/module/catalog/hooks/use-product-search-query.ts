import { listProductsForCatalogLocation } from '@/lib/catalog-location';
import { queryKeys } from '@/lib/query-keys';
import { isBackendCityId } from '@/lib/location-label';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import {
  normalizeProduct,
  type HomeCatalogProduct,
} from '@/module/home/lib/home-catalog';
import { useLocationStore } from '@/store/location.store';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const SEARCH_STALE_MS = 60_000;
export const SEARCH_LIMIT = 20;
export const MIN_QUERY_LEN = 2;

type UseProductSearchQueryOptions = {
  enabled?: boolean;
  categoryIds?: string[];
  categoryScopedSearch?: boolean;
};

export function useProductSearchQuery(
  query: string,
  { enabled = true, categoryIds, categoryScopedSearch = false }: UseProductSearchQueryOptions = {},
) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const debouncedQuery = useDebouncedValue(query, 300);

  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const hasLocation = Boolean(pincodeCode || cityId);

  const searchTerm =
    debouncedQuery.trim().length >= MIN_QUERY_LEN ? debouncedQuery.trim() : '';

  const scopedCategoryIds =
    searchTerm && categoryIds?.length ? categoryIds : undefined;
  const useCategoryOnly = Boolean(categoryScopedSearch && scopedCategoryIds?.length);
  const textQ = useCategoryOnly ? undefined : searchTerm || undefined;

  const qKey =
    textQ ?? (useCategoryOnly ? `cat:${scopedCategoryIds?.join(',')}` : 'popular');

  return useQuery({
    queryKey: queryKeys.productSearch(cityId, pincodeCode, qKey, scopedCategoryIds),
    queryFn: async (): Promise<HomeCatalogProduct[]> => {
      const data = await listProductsForCatalogLocation({
        pincode: pincodeCode,
        cityId,
        sort: 'popularity',
        limit: SEARCH_LIMIT,
        page: 1,
        q: textQ,
        categoryIds: scopedCategoryIds,
      });
      const items = (data as { items?: unknown[] })?.items ?? [];
      return items.map(normalizeProduct).filter(Boolean) as HomeCatalogProduct[];
    },
    enabled: enabled && hasLocation,
    staleTime: SEARCH_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

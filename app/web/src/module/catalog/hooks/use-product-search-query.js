import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products.api";
import { queryKeys } from "@/lib/query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { normalizeProduct } from "@/module/home/lib/home-catalog";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

const SEARCH_STALE_MS = 60_000;
const SEARCH_LIMIT = 5;
const MIN_QUERY_LEN = 2;

export function useProductSearchQuery(
  query,
  { enabled = true, categoryIds, categoryScopedSearch = false } = {},
) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const debouncedQuery = useDebouncedValue(query, 300);

  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, "").slice(0, 6) || undefined;
  const hasLocation = Boolean(pincodeCode || cityId);

  const searchTerm =
    debouncedQuery.trim().length >= MIN_QUERY_LEN ? debouncedQuery.trim() : "";

  const scopedCategoryIds =
    searchTerm && categoryIds?.length ? categoryIds : undefined;
  const useCategoryOnly =
    Boolean(categoryScopedSearch && scopedCategoryIds?.length);
  const textQ = useCategoryOnly ? undefined : searchTerm || undefined;

  return useQuery({
    queryKey: queryKeys.productSearch(
      cityId,
      pincodeCode,
      textQ ?? (useCategoryOnly ? `cat:${scopedCategoryIds.join(",")}` : ""),
      scopedCategoryIds,
    ),
    queryFn: async () => {
      const data = await listProducts({
        pincode: pincodeCode,
        cityId: pincodeCode ? undefined : cityId,
        sort: "popularity",
        limit: SEARCH_LIMIT,
        page: 1,
        q: textQ,
        categoryIds: scopedCategoryIds,
      });
      return (data?.items ?? []).map(normalizeProduct).filter(Boolean);
    },
    enabled: enabled && hasLocation,
    staleTime: SEARCH_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export { MIN_QUERY_LEN, SEARCH_LIMIT };

import { listProductsForCatalogLocation } from '@/lib/catalog-location';
import { isBackendCityId } from '@/lib/location-label';
import { queryKeys } from '@/lib/query-keys';
import type { CatalogSortId } from '@/module/catalog/lib/catalog-listing-sort';
import {
  normalizeProduct,
  type HomeCatalogProduct,
} from '@/module/home/lib/home-catalog';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';

export const CATALOG_LISTING_LIMIT = 24;
const LISTING_STALE_MS = 60_000;

export type CatalogPriceFacet = {
  minPaise: number;
  maxPaise: number;
};

export type CatalogListingResult = {
  items: HomeCatalogProduct[];
  total: number;
  priceFacet: CatalogPriceFacet;
};

type UseCatalogListingQueryOptions = {
  enabled?: boolean;
  categoryIds?: string[];
  /** City-wide listing with no category filter (explore “All”). */
  unfiltered?: boolean;
  instantOnly?: boolean;
  sort: CatalogSortId;
  minPriceRupees?: number | null;
  maxPriceRupees?: number | null;
  page: number;
  limit?: number;
};

export function useCatalogListingQuery({
  enabled = true,
  categoryIds,
  unfiltered = false,
  instantOnly = false,
  sort,
  minPriceRupees,
  maxPriceRupees,
  page,
  limit = CATALOG_LISTING_LIMIT,
}: UseCatalogListingQueryOptions) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());

  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const hasLocation = locationChosen && Boolean(cityId);

  const categoryIdsKey = categoryIds?.length ? categoryIds.join(',') : '';
  const listingScopeKey = instantOnly ? 'instant' : unfiltered ? 'all' : categoryIdsKey;

  return useQuery({
    queryKey: queryKeys.catalogListing(
      cityId,
      pincodeCode,
      listingScopeKey,
      sort,
      minPriceRupees ?? null,
      maxPriceRupees ?? null,
      page,
      limit,
      instantOnly,
    ),
    queryFn: async (): Promise<CatalogListingResult> => {
      const minPricePaise =
        minPriceRupees != null && minPriceRupees > 0 ? minPriceRupees * 100 : undefined;
      const maxPricePaise =
        maxPriceRupees != null ? maxPriceRupees * 100 : undefined;

      const data = await listProductsForCatalogLocation({
        pincode: pincodeCode,
        cityId,
        categoryIds: categoryIds?.length ? categoryIds : undefined,
        instant: instantOnly,
        sort,
        minPricePaise,
        maxPricePaise,
        page,
        limit,
      });

      const payload = data as {
        items?: unknown[];
        total?: number;
        facets?: { price?: { minPaise?: number; maxPaise?: number } };
      };

      const items = (payload.items ?? [])
        .map(normalizeProduct)
        .filter(Boolean) as HomeCatalogProduct[];

      const price = payload.facets?.price;

      return {
        items,
        total: Number(payload.total ?? 0),
        priceFacet: {
          minPaise: Number(price?.minPaise ?? 0),
          maxPaise: Number(price?.maxPaise ?? 0),
        },
      };
    },
    enabled:
      enabled && hasLocation && (Boolean(categoryIdsKey) || instantOnly || unfiltered),
    staleTime: LISTING_STALE_MS,
  });
}

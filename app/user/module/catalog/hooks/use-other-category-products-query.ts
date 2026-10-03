import { listProductsForCatalogLocation } from '@/lib/catalog-location';
import { queryKeys } from '@/lib/query-keys';
import { useCatalogLocationGate } from '@/module/catalog/hooks/use-catalog-location-gate';
import { normalizeProduct, type HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useQuery } from '@tanstack/react-query';

const OTHER_CATEGORY_LIMIT = 48;
const OTHER_CATEGORY_TAKE = 20;

export function useOtherCategoryProductsQuery(
  productId: string | undefined,
  categoryId: string | undefined,
) {
  const { ready, cityId, pincodeCode } = useCatalogLocationGate();

  return useQuery({
    queryKey: queryKeys.otherCategoryProducts(
      productId ?? '_',
      categoryId ?? '_',
      cityId,
      pincodeCode,
    ),
    queryFn: async () => {
      if (!productId || !categoryId) return [];
      const data = (await listProductsForCatalogLocation({
        cityId,
        pincode: pincodeCode,
        sort: 'popularity',
        page: 1,
        limit: OTHER_CATEGORY_LIMIT,
      })) as { items?: unknown[] };
      const rows = (data?.items ?? [])
        .filter((row) => {
          const r = row as { id?: string; categoryId?: string };
          if (!r.id || r.id === productId) return false;
          if (r.categoryId && r.categoryId === categoryId) return false;
          return true;
        })
        .slice(0, OTHER_CATEGORY_TAKE)
        .map(normalizeProduct)
        .filter(Boolean) as HomeCatalogProduct[];
      return rows;
    },
    enabled: Boolean(productId && categoryId && ready),
    staleTime: 120_000,
  });
}

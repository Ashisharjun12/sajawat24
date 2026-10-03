import { listProductsForCatalogLocation } from '@/lib/catalog-location';
import { queryKeys } from '@/lib/query-keys';
import { useCatalogLocationGate } from '@/module/catalog/hooks/use-catalog-location-gate';
import { normalizeProduct, type HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useQuery } from '@tanstack/react-query';

const SIMILAR_LIMIT = 20;

export function useSimilarProductsQuery(
  productId: string | undefined,
  categoryId: string | undefined,
) {
  const { ready, cityId, pincodeCode } = useCatalogLocationGate();

  return useQuery({
    queryKey: queryKeys.similarProducts(
      productId ?? '_',
      categoryId ?? '_',
      cityId,
      pincodeCode,
    ),
    queryFn: async () => {
      if (!productId || !categoryId) return [];
      const data = (await listProductsForCatalogLocation({
        categoryIds: [categoryId],
        cityId,
        pincode: pincodeCode,
        page: 1,
        limit: SIMILAR_LIMIT,
      })) as { items?: unknown[] };
      const rows = (data?.items ?? [])
        .filter((row) => {
          const id = (row as { id?: string })?.id;
          return id && id !== productId;
        })
        .map(normalizeProduct)
        .filter(Boolean) as HomeCatalogProduct[];
      return rows;
    },
    enabled: Boolean(productId && categoryId && ready),
    staleTime: 120_000,
  });
}

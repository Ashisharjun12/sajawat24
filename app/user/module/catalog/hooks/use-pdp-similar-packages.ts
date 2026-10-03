import { useMemo } from 'react';

import { useSimilarProductsQuery } from '@/module/catalog/hooks/use-similar-products-query';
import { resolveSimilarPackagesMeta } from '@/module/catalog/lib/product-category-rails';
import { useCatalogLocationGate } from '@/module/catalog/hooks/use-catalog-location-gate';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';

const SHEET_ITEM_LIMIT = 12;

type PdpProductRef = {
  id: string;
  categoryId?: string | null;
};

export function usePdpSimilarPackages(
  product: PdpProductRef | null | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { categories } = useHomeCategories();
  const { ready: hasLocation } = useCatalogLocationGate();

  const meta = useMemo(
    () => resolveSimilarPackagesMeta(product?.categoryId, categories),
    [product?.categoryId, categories],
  );

  const queryEnabled = enabled && Boolean(product?.id && product?.categoryId && meta);

  const { data: rows = [], isLoading, isFetching } = useSimilarProductsQuery(
    queryEnabled ? product?.id : undefined,
    queryEnabled ? product?.categoryId : undefined,
  );

  const items = useMemo(() => rows.slice(0, SHEET_ITEM_LIMIT), [rows]);

  return {
    meta,
    items,
    loading: queryEnabled && (isLoading || isFetching),
    hasLocation,
  };
}

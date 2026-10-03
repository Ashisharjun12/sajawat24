import { getApiError } from '@/api/client';
import { getProductForCatalogLocation } from '@/lib/catalog-location';
import { devApiLog } from '@/lib/dev-api-log';
import { queryKeys } from '@/lib/query-keys';
import { useCatalogLocationGate } from '@/module/catalog/hooks/use-catalog-location-gate';
import { useQuery } from '@tanstack/react-query';
import type { CatalogProductDetail } from '@/module/catalog/lib/product-detail';

export const PRODUCT_DETAIL_STALE_MS = 120_000;

export function useProductDetailLocation() {
  const { ready } = useCatalogLocationGate();
  return { hasLocation: ready };
}

export function useProductDetailQuery(productId: string, { enabled = true } = {}) {
  const { ready, cityId, pincodeCode } = useCatalogLocationGate();

  const queryEnabled = Boolean(productId) && ready && enabled;

  return useQuery({
    queryKey: queryKeys.productDetail(productId, cityId ?? null, pincodeCode ?? null),
    queryFn: async () => {
      devApiLog('info', 'PDP · start', { productId, cityId, pincode: pincodeCode });
      try {
        const data = (await getProductForCatalogLocation(productId, {
          cityId,
          pincode: pincodeCode,
        })) as CatalogProductDetail;
        devApiLog('response', 'PDP · loaded', {
          productId,
          name: data.name,
          pricePaise: data.pricePaise,
        });
        return data;
      } catch (err) {
        devApiLog('error', 'PDP · failed', { productId, reason: getApiError(err) });
        throw err;
      }
    },
    enabled: queryEnabled,
    staleTime: PRODUCT_DETAIL_STALE_MS,
  });
}

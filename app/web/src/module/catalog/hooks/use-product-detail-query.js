import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/products.api";
import { queryKeys } from "@/lib/query-keys";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

export const PRODUCT_DETAIL_STALE_MS = 120_000;

export function useProductDetailQuery(productId, { enabled = true } = {}) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);

  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, "").slice(0, 6) || undefined;
  const hasLocation = Boolean(pincodeCode || cityId);

  return useQuery({
    queryKey: queryKeys.productDetail(productId, cityId, pincodeCode),
    queryFn: () =>
      getProduct(productId, {
        pincode: pincodeCode,
        cityId: pincodeCode ? undefined : cityId,
      }),
    enabled: Boolean(productId) && hasLocation && enabled,
    staleTime: PRODUCT_DETAIL_STALE_MS,
  });
}

export function useProductDetailLocation() {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const hasLocation =
    Boolean(pincode?.code) || (Boolean(city?.id) && isBackendCityId(city.id));
  return { hasLocation };
}

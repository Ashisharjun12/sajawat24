import type { CouponLike } from '@/module/booking/lib/coupon-preview';
import { listAvailableCouponsForLocation } from '@/module/promotions/lib/coupons-location';
import { queryKeys } from '@/lib/query-keys';
import { isBackendCityId } from '@/lib/location-label';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';

type CouponScope = 'product' | 'browse' | 'city' | 'pdp';

type UseAvailableCouponsOptions = {
  productId?: string;
  categoryId?: string;
  scope?: CouponScope;
};

function apiScope(scope: CouponScope): 'product' | 'city' {
  if (scope === 'product') return 'product';
  // PDP + offers list: city scope returns applicable + other city coupons (web OffersPage).
  return 'city';
}

export function useAvailableCoupons({
  productId,
  categoryId,
  scope = 'product',
}: UseAvailableCouponsOptions = {}) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const serviceCityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const hasLocation = Boolean(serviceCityId || pincodeCode);

  const enabled =
    hasLocation &&
    (scope === 'city' || scope === 'browse' || scope === 'pdp'
      ? true
      : Boolean(productId && categoryId));

  const requestScope = scope === 'pdp' ? 'city' : apiScope(scope);

  const query = useQuery({
    queryKey: queryKeys.availableCoupons(
      productId,
      categoryId,
      serviceCityId,
      pincodeCode,
      scope,
    ),
    queryFn: async () => {
      const data = await listAvailableCouponsForLocation({
        productId: productId || undefined,
        categoryId: categoryId || undefined,
        scope: requestScope,
        cityId: serviceCityId,
        pincode: pincodeCode,
      });
      const payload = data as { items?: CouponLike[] };
      return Array.isArray(payload?.items) ? payload.items : [];
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    coupons: query.data ?? [],
    isPending: enabled && query.isPending,
    isError: enabled && query.isError,
    isEnabled: enabled,
  };
}

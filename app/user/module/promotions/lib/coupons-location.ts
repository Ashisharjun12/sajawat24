import { listAvailableCoupons } from '@/api/promotions.api';
import {
  type CatalogLocationInput,
  normalizeCatalogPincode,
  isPincodeNotServiceableError,
} from '@/lib/catalog-location';

type CouponListParams = {
  productId?: string;
  categoryId?: string;
  scope?: string;
};

async function withCouponLocationRetry<T>(
  attempt: (location: CatalogLocationInput) => Promise<T>,
  { cityId, pincode }: CatalogLocationInput,
): Promise<T> {
  const pin = normalizeCatalogPincode(pincode);

  if (cityId && pin) {
    try {
      return await attempt({ pincode: pin, cityId: undefined });
    } catch (err) {
      if (isPincodeNotServiceableError(err)) {
        return await attempt({ cityId, pincode: undefined });
      }
      throw err;
    }
  }

  if (pin) {
    return await attempt({ pincode: pin, cityId: undefined });
  }

  if (cityId) {
    return await attempt({ cityId, pincode: undefined });
  }

  throw new Error('pincode or cityId is required');
}

/** Promotions API accepts pincode OR cityId — retry city-only when pincode is rejected (catalog parity). */
export async function listAvailableCouponsForLocation(
  params: CouponListParams & CatalogLocationInput,
) {
  const { cityId, pincode, ...couponParams } = params;
  return withCouponLocationRetry(
    (loc) =>
      listAvailableCoupons({
        ...couponParams,
        cityId: loc.cityId,
        pincode: loc.pincode,
      }),
    { cityId, pincode },
  );
}

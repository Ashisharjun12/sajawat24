import { api, unwrap } from "@/api/api";
import { isPincodeNotServiceableError, normalizeCatalogPincode } from "@/lib/catalog-location";

/**
 * The coupons endpoint resolves the city from `pincode` first and ignores `cityId` when a PIN is
 * sent, so a rejected PIN must be retried with the city alone (user app `coupons-location.ts`).
 */
export async function listAvailableCoupons({
  productId,
  categoryId,
  cityId,
  pincode,
  scope,
} = {}) {
  const base = {};
  if (productId) base.productId = productId;
  if (categoryId) base.categoryId = categoryId;
  if (scope) base.scope = scope;

  const request = (location) =>
    api.get("/promotions/coupons/available", { params: { ...base, ...location } }).then(unwrap);

  const pin = normalizeCatalogPincode(pincode);
  if (pin) {
    try {
      return await request({ pincode: pin });
    } catch (err) {
      if (cityId && isPincodeNotServiceableError(err)) {
        return request({ cityId });
      }
      throw err;
    }
  }
  return request(cityId ? { cityId } : {});
}

import { api, unwrap } from '@/api/client';

export function listAvailableCoupons({
  productId,
  categoryId,
  cityId,
  pincode,
  scope,
}: {
  productId?: string;
  categoryId?: string;
  cityId?: string;
  pincode?: string;
  scope?: string;
} = {}) {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  if (categoryId) params.categoryId = categoryId;
  if (scope) params.scope = scope;
  if (pincode) params.pincode = pincode;
  else if (cityId) params.cityId = cityId;
  return api.get('/promotions/coupons/available', { params }).then(unwrap);
}

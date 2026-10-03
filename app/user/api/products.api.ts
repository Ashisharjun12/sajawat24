import { api, unwrap } from '@/api/client';

export function listProducts({
  pincode,
  cityId,
  categoryIds,
  minPricePaise,
  maxPricePaise,
  sort,
  q,
  instant,
  page = 1,
  limit = 24,
}: {
  pincode?: string;
  cityId?: string;
  categoryIds?: string[];
  minPricePaise?: number;
  maxPricePaise?: number;
  sort?: string;
  q?: string;
  instant?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const params: Record<string, string | number> = {
    page,
    limit,
  };
  if (pincode) params.pincode = pincode;
  if (cityId) params.cityId = cityId;
  if (categoryIds?.length) params.categoryIds = categoryIds.join(',');
  if (minPricePaise != null) params.minPricePaise = minPricePaise;
  if (maxPricePaise != null) params.maxPricePaise = maxPricePaise;
  if (sort) params.sort = sort;
  if (q?.trim()) params.q = q.trim();
  if (instant) params.instant = '1';

  return api.get('/catalog/products', { params }).then(unwrap);
}

export function getProduct(
  id: string,
  { pincode, cityId }: { pincode?: string; cityId?: string } = {},
) {
  const params: Record<string, string> = {};
  if (pincode) params.pincode = pincode;
  if (cityId) params.cityId = cityId;
  return api.get(`/catalog/products/${id}`, { params }).then(unwrap);
}

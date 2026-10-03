import { api, unwrap } from "@/api/api";

export function listProducts({
  pincode,
  cityId,
  categoryIds,
  minPricePaise,
  maxPricePaise,
  sort,
  q,
  page = 1,
  limit = 24,
} = {}) {
  const params = {
    page,
    limit,
  };
  if (pincode) params.pincode = pincode;
  if (cityId) params.cityId = cityId;
  if (categoryIds?.length) params.categoryIds = categoryIds.join(",");
  if (minPricePaise != null) params.minPricePaise = minPricePaise;
  if (maxPricePaise != null) params.maxPricePaise = maxPricePaise;
  if (sort) params.sort = sort;
  if (q?.trim()) params.q = q.trim();
  return api.get("/catalog/products", { params }).then(unwrap);
}

export function getProduct(id, { pincode, cityId } = {}) {
  const params = {};
  if (pincode) params.pincode = pincode;
  if (cityId) params.cityId = cityId;
  return api.get(`/catalog/products/${id}`, { params }).then(unwrap);
}

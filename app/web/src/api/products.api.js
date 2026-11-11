import { api, unwrap } from "@/api/api";
import { withCatalogLocationRetry } from "@/lib/catalog-location";

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
  const base = {
    page,
    limit,
  };
  if (categoryIds?.length) base.categoryIds = categoryIds.join(",");
  if (minPricePaise != null) base.minPricePaise = minPricePaise;
  if (maxPricePaise != null) base.maxPricePaise = maxPricePaise;
  if (sort) base.sort = sort;
  if (q?.trim()) base.q = q.trim();

  return withCatalogLocationRetry(
    (location) => api.get("/catalog/products", { params: { ...base, ...location } }).then(unwrap),
    { cityId, pincode },
  );
}

export function getProduct(id, { pincode, cityId } = {}) {
  return withCatalogLocationRetry(
    (location) => api.get(`/catalog/products/${id}`, { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

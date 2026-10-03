import { api, unwrap } from "@/api/api";

export function listAdmin({ page = 1, limit = 20, q, isActive, categoryId, cityId, price } = {}) {
  return api
    .get("/admin/products", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(isActive === "true" || isActive === "false" ? { isActive } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(cityId ? { cityId } : {}),
        ...(price ? { price } : {}),
      },
    })
    .then(unwrap);
}

export function getAdmin(id) {
  return api.get(`/admin/products/${id}`).then(unwrap);
}

export function createProduct(body) {
  return api.post("/admin/products", body).then(unwrap);
}

export function patchProduct(id, body) {
  return api.patch(`/admin/products/${id}`, body).then(unwrap);
}

export function deleteProduct(id) {
  return api.delete(`/admin/products/${id}`).then(unwrap);
}

export function setCityPrice(id, { cityId, pricePaise, compareAtPaise = null }) {
  return api
    .put(`/admin/products/${id}/city-prices`, { cityId, pricePaise, compareAtPaise })
    .then(unwrap);
}

export function deleteCityPrice(id, cityId) {
  return api.delete(`/admin/products/${id}/city-prices/${cityId}`).then(unwrap);
}

export function mapProductAddon(id, addonId) {
  return api.post(`/admin/products/${id}/addons`, { addonId }).then(unwrap);
}

export function unmapProductAddon(id, addonId) {
  return api.delete(`/admin/products/${id}/addons/${addonId}`).then(unwrap);
}

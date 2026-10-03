import { api, unwrap } from "@/api/api";

export function listSections() {
  return api.get("/admin/sections").then(unwrap);
}

export function listGlobalProductOccupancy() {
  return api.get("/admin/sections/global-product-occupancy").then(unwrap);
}

export function createSection(body) {
  return api.post("/admin/sections", body).then(unwrap);
}

export function patchSection(id, body) {
  return api.patch(`/admin/sections/${id}`, body).then(unwrap);
}

export function deleteSection(id) {
  return api.delete(`/admin/sections/${id}`).then(unwrap);
}

export function listSectionProducts(id, cityId) {
  return api
    .get(`/admin/sections/${id}/products`, {
      params: cityId ? { cityId } : {},
    })
    .then(unwrap);
}

export function putSectionProducts(id, { cityId, productIds }) {
  return api.put(`/admin/sections/${id}/products`, { cityId, productIds }).then(unwrap);
}

export function deleteSectionCityOverride(id, cityId) {
  return api.delete(`/admin/sections/${id}/city-overrides/${cityId}`).then(unwrap);
}

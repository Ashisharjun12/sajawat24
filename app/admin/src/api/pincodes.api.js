import { api, unwrap } from "@/api/api";

export function listAdmin({ page = 1, limit = 20, cityId, q, isServiceable } = {}) {
  return api
    .get("/admin/pincodes", {
      params: {
        page,
        limit,
        ...(cityId ? { cityId } : {}),
        ...(q ? { q } : {}),
        ...(isServiceable === "true" || isServiceable === "false" ? { isServiceable } : {}),
      },
    })
    .then(unwrap);
}

export function createPincode(body) {
  return api.post("/admin/pincodes", body).then(unwrap);
}

export function patchPincode(id, body) {
  return api.patch(`/admin/pincodes/${id}`, body).then(unwrap);
}

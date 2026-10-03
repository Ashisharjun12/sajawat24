import { api, unwrap } from "@/api/api";

export function listActive() {
  return api.get("/geo/cities").then(unwrap);
}

export function listAdmin({ page = 1, limit = 20, q, isActive } = {}) {
  return api
    .get("/admin/cities", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(isActive === "true" || isActive === "false" ? { isActive } : {}),
      },
    })
    .then(unwrap);
}

export function createCity(body) {
  return api.post("/admin/cities", body).then(unwrap);
}

export function patchCity(id, body) {
  return api.patch(`/admin/cities/${id}`, body).then(unwrap);
}

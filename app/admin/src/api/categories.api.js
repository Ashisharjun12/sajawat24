import { api, unwrap } from "@/api/api";

export function listAdmin({ page = 1, limit = 20, q, isActive, parentId } = {}) {
  return api
    .get("/admin/categories", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(isActive === "true" || isActive === "false" ? { isActive } : {}),
        ...(parentId === null ? { parentId: "null" } : parentId ? { parentId } : {}),
      },
    })
    .then(unwrap);
}

export function createCategory(body) {
  return api.post("/admin/categories", body).then(unwrap);
}

export function patchCategory(id, body) {
  return api.patch(`/admin/categories/${id}`, body).then(unwrap);
}

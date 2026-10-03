import { api, unwrap } from "@/api/api";

export function listFolders({ parentId, q } = {}) {
  return api
    .get("/admin/media-folders", {
      params: {
        ...(parentId === null ? { parentId: "null" } : parentId ? { parentId } : {}),
        ...(q ? { q } : {}),
      },
    })
    .then(unwrap);
}

export function createFolder(body) {
  return api.post("/admin/media-folders", body).then(unwrap);
}

export function patchFolder(id, body) {
  return api.patch(`/admin/media-folders/${id}`, body).then(unwrap);
}

export function deleteFolder(id) {
  return api.delete(`/admin/media-folders/${id}`).then(unwrap);
}

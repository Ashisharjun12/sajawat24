import { api, unwrap } from "@/api/api"

export function getBrandSite() {
  return api.get("/admin/brand/site").then(unwrap)
}

export function patchBrandSite(body) {
  return api.patch("/admin/brand/site", body).then(unwrap)
}

export function listBrandSocialLinks({ page = 1, limit = 200, status } = {}) {
  return api
    .get("/admin/brand/social-links", { params: { page, limit, ...(status ? { status } : {}) } })
    .then(unwrap)
}

export function createBrandSocialLink(body) {
  return api.post("/admin/brand/social-links", body).then(unwrap)
}

export function patchBrandSocialLink(id, body) {
  return api.patch(`/admin/brand/social-links/${id}`, body).then(unwrap)
}

export function reorderBrandSocialLinks({ ids }) {
  return api.put("/admin/brand/social-links/reorder", { ids }).then(unwrap)
}

export function deleteBrandSocialLink(id) {
  return api.delete(`/admin/brand/social-links/${id}`).then(unwrap)
}

export function listBrandFooterColumns() {
  return api.get("/admin/brand/footer-columns").then(unwrap)
}

export function createBrandFooterColumn(body) {
  return api.post("/admin/brand/footer-columns", body).then(unwrap)
}

export function patchBrandFooterColumn(id, body) {
  return api.patch(`/admin/brand/footer-columns/${id}`, body).then(unwrap)
}

export function reorderBrandFooterColumns({ ids }) {
  return api.put("/admin/brand/footer-columns/reorder", { ids }).then(unwrap)
}

export function deleteBrandFooterColumn(id) {
  return api.delete(`/admin/brand/footer-columns/${id}`).then(unwrap)
}

export function putBrandFooterColumnLinks(id, links) {
  return api.put(`/admin/brand/footer-columns/${id}/links`, { links }).then(unwrap)
}

export function listBrandPages({ page = 1, limit = 50, status } = {}) {
  return api
    .get("/admin/brand/pages", { params: { page, limit, ...(status ? { status } : {}) } })
    .then(unwrap)
}

export function listBrandPagesPicker() {
  return api.get("/admin/brand/pages/picker").then(unwrap)
}

export function getBrandPage(id) {
  return api.get(`/admin/brand/pages/${id}`).then(unwrap)
}

export function createBrandPage(body) {
  return api.post("/admin/brand/pages", body).then(unwrap)
}

export function patchBrandPage(id, body) {
  return api.patch(`/admin/brand/pages/${id}`, body).then(unwrap)
}

export function deleteBrandPage(id) {
  return api.delete(`/admin/brand/pages/${id}`).then(unwrap)
}

import { api, unwrap } from "@/api/api"

export function listCmsBanners({
  page = 1,
  limit = 50,
  placement,
  excludePlacement,
  status,
  platform,
} = {}) {
  return api
    .get("/admin/cms/banners", {
      params: {
        page,
        limit,
        ...(placement ? { placement } : {}),
        ...(excludePlacement ? { excludePlacement } : {}),
        ...(status ? { status } : {}),
        ...(platform ? { platform } : {}),
      },
    })
    .then(unwrap)
}

export function createCmsBanner(body) {
  return api.post("/admin/cms/banners", body).then(unwrap)
}

export function patchCmsBanner(id, body) {
  return api.patch(`/admin/cms/banners/${id}`, body).then(unwrap)
}

export function reorderCmsBanners({ placement, ids }) {
  return api.put("/admin/cms/banners/reorder", { placement, ids }).then(unwrap)
}

export function deleteCmsBanner(id) {
  return api.delete(`/admin/cms/banners/${id}`).then(unwrap)
}

export function listCmsTestimonials({ page = 1, limit = 50, status } = {}) {
  return api
    .get("/admin/cms/testimonials", { params: { page, limit, ...(status ? { status } : {}) } })
    .then(unwrap)
}

export function createCmsTestimonial(body) {
  return api.post("/admin/cms/testimonials", body).then(unwrap)
}

export function patchCmsTestimonial(id, body) {
  return api.patch(`/admin/cms/testimonials/${id}`, body).then(unwrap)
}

export function deleteCmsTestimonial(id) {
  return api.delete(`/admin/cms/testimonials/${id}`).then(unwrap)
}

export function listHomeLayoutBlocks({ cityId = "global", status } = {}) {
  return api
    .get("/admin/cms/home-layout-blocks", {
      params: {
        cityId,
        ...(status ? { status } : {}),
      },
    })
    .then(unwrap)
}

export function createHomeLayoutBlock(body) {
  return api.post("/admin/cms/home-layout-blocks", body).then(unwrap)
}

export function patchHomeLayoutBlock(id, body) {
  return api.patch(`/admin/cms/home-layout-blocks/${id}`, body).then(unwrap)
}

export function reorderHomeLayoutBlocks({ cityId, ids }) {
  return api.put("/admin/cms/home-layout-blocks/reorder", { cityId, ids }).then(unwrap)
}

export function deleteHomeLayoutBlock(id) {
  return api.delete(`/admin/cms/home-layout-blocks/${id}`).then(unwrap)
}

export function listCmsFaqs({ page = 1, limit = 50, status } = {}) {
  return api
    .get("/admin/cms/faqs", { params: { page, limit, ...(status ? { status } : {}) } })
    .then(unwrap)
}

export function createCmsFaq(body) {
  return api.post("/admin/cms/faqs", body).then(unwrap)
}

export function patchCmsFaq(id, body) {
  return api.patch(`/admin/cms/faqs/${id}`, body).then(unwrap)
}

export function reorderCmsFaqs({ ids }) {
  return api.put("/admin/cms/faqs/reorder", { ids }).then(unwrap)
}

export function deleteCmsFaq(id) {
  return api.delete(`/admin/cms/faqs/${id}`).then(unwrap)
}

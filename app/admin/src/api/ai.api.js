import { api, unwrap } from "@/api/api"

export function generateProductCopy(payload) {
  return api
    .post("/admin/ai/catalog/generate-product-copy", payload, { timeout: 130_000 })
    .then(unwrap)
}

export function suggestCmsFaq(payload) {
  return api.post("/admin/ai/cms/suggest-faq", payload, { timeout: 130_000 }).then(unwrap)
}

export function suggestCmsTestimonial(payload) {
  return api
    .post("/admin/ai/cms/suggest-testimonial", payload, { timeout: 130_000 })
    .then(unwrap)
}

export function suggestCmsAnnouncement(payload) {
  return api
    .post("/admin/ai/cms/suggest-announcement", payload, { timeout: 130_000 })
    .then(unwrap)
}

export function suggestCmsBrandPage(payload) {
  return api
    .post("/admin/ai/cms/suggest-brand-page", payload, { timeout: 130_000 })
    .then(unwrap)
}

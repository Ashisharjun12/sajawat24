import { api, unwrap } from "@/api/api"

export function generateProductCopy(payload) {
  return api.post("/admin/ai/catalog/generate-product-copy", payload).then(unwrap)
}

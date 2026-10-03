import { WEB_URL } from "@/lib/env"

export function webProductUrl(productId) {
  const base = WEB_URL.replace(/\/$/, "")
  const id = String(productId ?? "").trim()
  if (!id) return base
  return `${base}/p/${id}`
}

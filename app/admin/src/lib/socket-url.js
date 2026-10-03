import { API_URL } from "@/lib/env"

export function getSocketUrl() {
  return API_URL.replace(/\/api\/v1\/?$/, "")
}

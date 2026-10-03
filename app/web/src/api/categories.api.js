import { api, unwrap } from "@/api/api";

export function listCategories() {
  return api.get("/catalog/categories").then(unwrap);
}

import { api, unwrap } from "@/api/api";

export function getSiteShell({ platform = "web" } = {}) {
  return api.get("/catalog/cms/site-shell", { params: { platform } }).then(unwrap);
}

export function getCmsPage(slug, { platform = "web" } = {}) {
  return api
    .get(`/catalog/cms/pages/${encodeURIComponent(slug)}`, { params: { platform } })
    .then(unwrap);
}

export function getHomeCms({ cityId, pincode, platform = "web" } = {}) {
  return api
    .get("/catalog/cms/home", {
      params: {
        ...(cityId ? { cityId } : {}),
        ...(pincode ? { pincode } : {}),
        platform,
      },
    })
    .then(unwrap);
}

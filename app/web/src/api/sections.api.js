import { api, unwrap } from "@/api/api";
import { withCatalogLocationRetry } from "@/lib/catalog-location";

export function listSections({ pincode, cityId } = {}) {
  return withCatalogLocationRetry(
    (location) => api.get("/catalog/sections", { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

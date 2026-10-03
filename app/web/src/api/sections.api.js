import { api, unwrap } from "@/api/api";

export function listSections({ pincode, cityId } = {}) {
  return api
    .get("/catalog/sections", {
      params: {
        ...(pincode ? { pincode } : {}),
        ...(cityId ? { cityId } : {}),
      },
    })
    .then(unwrap);
}

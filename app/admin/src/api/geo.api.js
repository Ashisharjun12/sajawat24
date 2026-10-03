import { api, unwrap } from "@/api/api";

export function resolvePincode(pincode, options = {}) {
  const params = { pincode };
  if (options.cityId) {
    params.cityId = options.cityId;
  }
  return api.get("/geo/resolve", { params }).then(unwrap);
}

export function isPincodeDeliverable(data) {
  return Boolean(data?.deliverable && data?.city?.id);
}

import { api, unwrap } from "@/api/api";

export function listVendors({
  page = 1,
  limit = 20,
  status,
  search,
  cityId,
  isOnDuty,
  joinedFrom,
  joinedTo,
} = {}) {
  return api
    .get("/admin/vendors", {
      params: {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
        ...(cityId ? { cityId } : {}),
        ...(isOnDuty === true || isOnDuty === false ? { isOnDuty: String(isOnDuty) } : {}),
        ...(joinedFrom ? { joinedFrom } : {}),
        ...(joinedTo ? { joinedTo } : {}),
      },
    })
    .then(unwrap);
}

export function getVendor(id) {
  return api.get(`/admin/vendors/${id}`).then(unwrap);
}

export function listVendorWorkers(id, { page = 1, limit = 20, q, status } = {}) {
  return api
    .get(`/admin/vendors/${id}/members`, {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      },
    })
    .then(unwrap);
}

export function patchVendorStatus(id, onboardingStatus) {
  return api.patch(`/admin/vendors/${id}`, { onboardingStatus }).then(unwrap);
}

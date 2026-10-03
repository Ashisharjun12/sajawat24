import { api, unwrap } from "@/api/api";

export function listAssignCandidates(orderId, { q, samePin } = {}) {
  return api
    .get(`/admin/orders/${orderId}/assign-candidates`, {
      params: {
        ...(q ? { q } : {}),
        ...(samePin ? { samePin: "true" } : {}),
      },
    })
    .then(unwrap);
}

export function assignVendor(orderId, vendorId) {
  return api.post(`/admin/orders/${orderId}/assign`, { vendorId }).then(unwrap);
}

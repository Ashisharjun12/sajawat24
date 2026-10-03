import { api, unwrap } from "@/api/api";

export function listBookings({
  page = 1,
  limit = 20,
  q,
  status,
  cityId,
  paymentMethod,
  sort,
  needsAssign,
  fulfillmentType,
  dispatchStatus,
  userId,
  vendorId,
} = {}) {
  return api
    .get("/admin/orders", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(cityId ? { cityId } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        ...(sort ? { sort } : {}),
        ...(needsAssign === "true" || needsAssign === "false" ? { needsAssign } : {}),
        ...(fulfillmentType ? { fulfillmentType } : {}),
        ...(dispatchStatus ? { dispatchStatus } : {}),
        ...(userId ? { userId } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
    })
    .then(unwrap);
}

export function getBooking(id) {
  return api.get(`/admin/orders/${id}`).then(unwrap);
}

export function createBooking(body) {
  return api.post("/admin/orders", body).then(unwrap);
}

import { api, unwrap } from "@/api/api";

export function listCustomers({
  page = 1,
  limit = 20,
  status,
  search,
  cityId,
  hasBookings,
  joinedFrom,
  joinedTo,
} = {}) {
  return api
    .get("/admin/customers", {
      params: {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
        ...(cityId ? { cityId } : {}),
        ...(hasBookings === true || hasBookings === false ? { hasBookings: String(hasBookings) } : {}),
        ...(joinedFrom ? { joinedFrom } : {}),
        ...(joinedTo ? { joinedTo } : {}),
      },
    })
    .then(unwrap);
}

export function getCustomer(id) {
  return api.get(`/admin/customers/${id}`).then(unwrap);
}

export function patchCustomerStatus(id, status) {
  return api.patch(`/admin/customers/${id}`, { status }).then(unwrap);
}

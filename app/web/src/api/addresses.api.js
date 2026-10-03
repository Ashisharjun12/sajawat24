import { api, unwrap } from "@/api/api";

export function listAddresses() {
  return api.get("/user/addresses").then(unwrap).then((data) => data?.items ?? []);
}

export function createAddress(body) {
  return api.post("/user/addresses", body).then(unwrap).then((data) => data?.address);
}

export function updateAddress(id, body) {
  return api.patch(`/user/addresses/${id}`, body).then(unwrap).then((data) => data?.address);
}

export function deleteAddress(id) {
  return api.delete(`/user/addresses/${id}`).then(unwrap);
}

export function setDefaultAddress(id) {
  return api.post(`/user/addresses/${id}/default`).then(unwrap).then((data) => data?.address);
}

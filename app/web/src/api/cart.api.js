import { api, unwrap } from "@/api/api";

export function getCart() {
  return api.get("/cart").then(unwrap);
}

export function addCartItem(body) {
  return api.post("/cart/items", body).then(unwrap);
}

export function patchCartItem(id, body) {
  return api.patch(`/cart/items/${id}`, body).then(unwrap);
}

export function removeCartItem(id) {
  return api.delete(`/cart/items/${id}`).then(unwrap);
}

export function setCartLocation(body) {
  return api.post("/cart/location", body).then(unwrap);
}

export function setCartDeliveryGeo(body) {
  return api.post("/cart/delivery-geo", body).then(unwrap);
}

export function mergeCart() {
  return api.post("/cart/merge").then(unwrap);
}

export function applyCartCoupon(code) {
  return api.post("/cart/coupon", { code }).then(unwrap);
}

export function removeCartCoupon() {
  return api.delete("/cart/coupon").then(unwrap);
}

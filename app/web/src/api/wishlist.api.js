import { api, unwrap } from "@/api/api";

function locationParams(cityId, pincode) {
  const params = {};
  if (cityId) params.cityId = cityId;
  if (pincode) params.pincode = pincode;
  return params;
}

export function getWishlist({ cityId, pincode }) {
  return api.get("/wishlist", { params: locationParams(cityId, pincode) }).then(unwrap);
}

export function addWishlistItem(productId, { cityId, pincode }) {
  return api
    .post("/wishlist/items", { productId }, { params: locationParams(cityId, pincode) })
    .then(unwrap);
}

export function removeWishlistItem(productId, { cityId, pincode }) {
  return api
    .delete(`/wishlist/items/${productId}`, { params: locationParams(cityId, pincode) })
    .then(unwrap);
}

export function mergeWishlist(productIds, { cityId, pincode }) {
  return api
    .post("/wishlist/merge", { productIds }, { params: locationParams(cityId, pincode) })
    .then(unwrap);
}

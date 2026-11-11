import { api, unwrap } from "@/api/api";
import { withCatalogLocationRetry } from "@/lib/catalog-location";

export function getWishlist({ cityId, pincode }) {
  return withCatalogLocationRetry(
    (location) => api.get("/wishlist", { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

export function addWishlistItem(productId, { cityId, pincode }) {
  return withCatalogLocationRetry(
    (location) => api.post("/wishlist/items", { productId }, { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

export function removeWishlistItem(productId, { cityId, pincode }) {
  return withCatalogLocationRetry(
    (location) => api.delete(`/wishlist/items/${productId}`, { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

export function mergeWishlist(productIds, { cityId, pincode }) {
  return withCatalogLocationRetry(
    (location) => api.post("/wishlist/merge", { productIds }, { params: location }).then(unwrap),
    { cityId, pincode },
  );
}

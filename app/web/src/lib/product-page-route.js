/** Product detail (`/p/:id`), not reviews or other sub-routes. */
export function isProductDetailPath(pathname) {
  return /^\/p\/[^/]+$/.test(pathname);
}

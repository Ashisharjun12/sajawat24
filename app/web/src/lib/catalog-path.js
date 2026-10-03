export function categoryPath(parent, child) {
  if (child?.slug) return `/c/${parent.slug}/${child.slug}`;
  return `/c/${parent.slug}`;
}

export function productPath(product) {
  const id = typeof product === "string" ? product : product?.id;
  return `/p/${id}`;
}

export function productReviewsPath(productOrId) {
  const id = typeof productOrId === "string" ? productOrId : productOrId?.id;
  return `/p/${id}/reviews`;
}

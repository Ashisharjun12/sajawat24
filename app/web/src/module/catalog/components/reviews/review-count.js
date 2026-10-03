/** Resolve display count when API summary and product denormalized fields disagree. */
export function resolveProductReviewCount({ data, product, items = data?.items }) {
  const list = items ?? data?.items ?? [];
  return Math.max(
    Number(data?.summary?.reviewCount) || 0,
    Number(data?.total) || 0,
    list.length,
    Number(product?.reviewCount) || 0,
  );
}

export function hasProductReviews({ data, product, items }) {
  const list = items ?? data?.items ?? [];
  return resolveProductReviewCount({ data, product, items: list }) > 0 || list.length > 0;
}

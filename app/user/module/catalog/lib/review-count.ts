export function resolveProductReviewCount({
  data,
  product,
  items,
}: {
  data?: { summary?: { reviewCount?: number }; total?: number; items?: unknown[] } | null;
  product?: { reviewCount?: number | null } | null;
  items?: unknown[];
}) {
  const list = items ?? data?.items ?? [];
  return Math.max(
    Number(data?.summary?.reviewCount) || 0,
    Number(data?.total) || 0,
    list.length,
    Number(product?.reviewCount) || 0,
  );
}

export function hasProductReviews({
  data,
  product,
  items,
}: {
  data?: { summary?: { reviewCount?: number }; total?: number; items?: unknown[] } | null;
  product?: { reviewCount?: number | null } | null;
  items?: unknown[];
}) {
  const list = items ?? data?.items ?? [];
  return resolveProductReviewCount({ data, product, items: list }) > 0 || list.length > 0;
}

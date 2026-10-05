export function apiItemToRow(item) {
  const product = item.product;
  return {
    productId: item.productId,
    addedAt: Date.parse(item.addedAt) || Date.now(),
    available: item.available,
    unavailableReason: item.unavailableReason,
    product: product
      ? {
          id: product.id,
          name: product.title ?? product.name,
          title: product.title ?? product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
          pricePaise: product.pricePaise,
          compareAtPaise: product.compareAtPaise,
          rating: product.ratingAvg != null ? Number(product.ratingAvg) : null,
          reviewCount: product.reviewCount ?? null,
          instant: product.instant ?? null,
        }
      : null,
  };
}

export function localEntryToRow(entry) {
  return {
    productId: entry.productId,
    addedAt: entry.addedAt,
    available: true,
    product: {
      id: entry.productId,
      name: entry.title,
      title: entry.title,
      slug: entry.productId,
      imageUrl: entry.imageUrl,
      pricePaise: entry.pricePaise,
      compareAtPaise: entry.compareAtPaise ?? null,
      rating: null,
      reviewCount: null,
      instant: null,
    },
  };
}

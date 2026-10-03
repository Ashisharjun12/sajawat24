import { useMemo } from "react";
import { usePdpProductRail } from "@/module/catalog/hooks/use-pdp-product-rail";
import { resolveSimilarPackagesMeta } from "@/module/catalog/lib/product-category-rails";
import { useCatalogStore } from "@/store/catalog.store";

export function usePdpSimilarPackages(product, { enabled = false } = {}) {
  const rawCategories = useCatalogStore((s) => s.categories);

  const meta = useMemo(
    () => resolveSimilarPackagesMeta(product?.categoryId, rawCategories),
    [product?.categoryId, rawCategories],
  );

  const rail = usePdpProductRail(product, {
    variant: "same-category",
    categoryIds: meta?.categoryIds ?? [],
    enabled: enabled && Boolean(meta),
  });

  return {
    meta,
    items: rail.items,
    loading: rail.loading,
    hasLocation: rail.hasLocation,
  };
}

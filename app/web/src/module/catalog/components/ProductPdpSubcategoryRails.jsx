import { useMemo } from "react";
import { categoryPath } from "@/lib/catalog-path";
import {
  ProductPdpProductRail,
  RAIL_SECTION_FIRST,
  RAIL_SECTION_FOLLOW,
} from "@/module/catalog/components/ProductPdpProductRail";
import {
  getCategoryListingHref,
  getSubcategoryRailCopy,
  resolveSubcategoryRailContext,
  TOP_LEVEL_SIMILAR_RAIL_COPY,
} from "@/module/catalog/lib/product-category-rails";
import { useCatalogStore } from "@/store/catalog.store";

export function ProductPdpSubcategoryRails({ product }) {
  const rawCategories = useCatalogStore((s) => s.categories);

  const context = useMemo(
    () => resolveSubcategoryRailContext(product?.categoryId, rawCategories),
    [product?.categoryId, rawCategories],
  );

  if (!product?.categoryId) return null;

  if (context.mode === "top-level") {
    return (
      <ProductPdpProductRail
        product={product}
        variant="same-category"
        categoryIds={[product.categoryId]}
        title={TOP_LEVEL_SIMILAR_RAIL_COPY.title}
        subtitle={TOP_LEVEL_SIMILAR_RAIL_COPY.subtitle}
        ariaLabel={TOP_LEVEL_SIMILAR_RAIL_COPY.ariaLabel}
        sectionClass={RAIL_SECTION_FIRST}
        viewAllHref={getCategoryListingHref(product.categoryId, rawCategories)}
      />
    );
  }

  const { parent, railCategories } = context;

  return (
    <>
      {railCategories.map((subcategory, index) => {
        const copy = getSubcategoryRailCopy(subcategory, parent);
        const viewAllHref =
          parent && subcategory ? categoryPath(parent, subcategory) : undefined;

        return (
          <ProductPdpProductRail
            key={subcategory.id}
            product={product}
            variant="same-category"
            categoryIds={[subcategory.id]}
            title={copy.title}
            subtitle={copy.subtitle}
            ariaLabel={copy.ariaLabel}
            sectionClass={index === 0 ? RAIL_SECTION_FIRST : RAIL_SECTION_FOLLOW}
            viewAllHref={viewAllHref}
          />
        );
      })}
    </>
  );
}

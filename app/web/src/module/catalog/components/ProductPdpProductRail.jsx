import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PdpProductRailHeader } from "@/module/catalog/components/PdpProductRailHeader";
import { usePdpProductRail } from "@/module/catalog/hooks/use-pdp-product-rail";
import {
  EXPLORE_OTHER_RAIL_COPY,
  TOP_LEVEL_SIMILAR_RAIL_COPY,
} from "@/module/catalog/lib/product-category-rails";
import {
  HomeProductCardRail,
  HomeProductCardRailSkeleton,
} from "@/module/home/components/HomeProductCard";
import { PRODUCT_RAIL_PDP_MOBILE_CARD_SLOT } from "@/module/home/lib/product-rail-layout";

export const RAIL_SECTION_FIRST =
  "mt-10 border-t border-border/60 pt-8 md:mt-14 md:pt-10";
export const RAIL_SECTION_FOLLOW =
  "mt-6 border-t border-border/60 pt-6 md:mt-8 md:pt-7";

const SCROLL_ROW =
  "flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const CARD_SLOT = cn("shrink-0 snap-start", PRODUCT_RAIL_PDP_MOBILE_CARD_SLOT);

export function ProductPdpProductRail({
  product,
  variant = "same-category",
  categoryIds: categoryIdsProp,
  title,
  subtitle,
  ariaLabel,
  sectionClass = RAIL_SECTION_FIRST,
  viewAllHref,
  viewAllLabel = "View all",
}) {
  const resolvedCategoryIds = useMemo(() => {
    if (variant === "other-categories") return [];
    if (categoryIdsProp?.length) return categoryIdsProp;
    if (product?.categoryId) return [product.categoryId];
    return [];
  }, [variant, categoryIdsProp, product?.categoryId]);

  const copy =
    variant === "other-categories" ? EXPLORE_OTHER_RAIL_COPY : TOP_LEVEL_SIMILAR_RAIL_COPY;

  const { items, loading } = usePdpProductRail(product, {
    variant,
    categoryIds: resolvedCategoryIds,
  });

  const resolvedViewAllHref =
    viewAllHref ??
    (variant === "other-categories" ? EXPLORE_OTHER_RAIL_COPY.viewAllHref : undefined);

  if (!loading && items.length === 0) return null;

  return (
    <section
      className={sectionClass}
      aria-label={ariaLabel ?? copy.ariaLabel}
    >
      <PdpProductRailHeader
        title={title ?? copy.title}
        subtitle={subtitle ?? copy.subtitle}
        viewAllHref={resolvedViewAllHref}
        viewAllLabel={viewAllLabel}
      />

      {loading ? (
        <div className={cn(SCROLL_ROW, "-mx-4 px-4 md:mx-0 md:px-0")}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={CARD_SLOT}>
              <HomeProductCardRailSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(SCROLL_ROW, "-mx-4 px-4 md:mx-0 md:px-0")}>
              {items.map((item) => (
            <div key={item.id} className={CARD_SLOT}>
                  <HomeProductCardRail product={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

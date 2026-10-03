import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PdpProductRailHeader } from "@/module/catalog/components/PdpProductRailHeader";
import { getCategoryListingHref } from "@/module/catalog/lib/product-category-rails";
import {
  HomeProductCardRail,
  HomeProductCardRailSkeleton,
} from "@/module/home/components/HomeProductCard";
import { PRODUCT_RAIL_PDP_MOBILE_CARD_SLOT } from "@/module/home/lib/product-rail-layout";
import { useCatalogStore } from "@/store/catalog.store";

const SCROLL_ROW =
  "flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const CARD_SLOT = cn("shrink-0 snap-start", PRODUCT_RAIL_PDP_MOBILE_CARD_SLOT);

function resolveRailViewAllHref(section, categories) {
  const first = section.items?.find((product) => product?.categoryId);
  if (first?.categoryId) {
    return getCategoryListingHref(first.categoryId, categories);
  }
  return "/decorations";
}

export function HomeProductRail({
  section,
  loading = false,
  title: titleOverride,
  subtitle,
  showTitle = true,
  showSubtitle = true,
}) {
  const categories = useCatalogStore((s) => s.categories);
  const railTitle = titleOverride ?? section.name;
  const viewAllHref = useMemo(
    () => resolveRailViewAllHref(section, categories),
    [section, categories],
  );

  const showHeader = showTitle || (showSubtitle && subtitle);

  return (
    <section aria-label={railTitle}>
      {showHeader ? (
        <PdpProductRailHeader
          title={showTitle ? railTitle : " "}
          subtitle={showSubtitle ? subtitle : undefined}
          viewAllHref={loading ? undefined : viewAllHref}
        />
      ) : null}

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
          {section.items.map((product) => (
            <div key={product.id} className={CARD_SLOT}>
              <HomeProductCardRail
                product={product}
                badgeLabel={section.badgeLabel ?? section.name}
                badgeColor={section.badgeColor}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

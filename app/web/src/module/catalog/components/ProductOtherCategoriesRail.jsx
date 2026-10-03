import {
  ProductPdpProductRail,
  RAIL_SECTION_FOLLOW,
} from "@/module/catalog/components/ProductPdpProductRail";
import { EXPLORE_OTHER_RAIL_COPY } from "@/module/catalog/lib/product-category-rails";

export function ProductOtherCategoriesRail({ product }) {
  return (
    <ProductPdpProductRail
      product={product}
      variant="other-categories"
      title={EXPLORE_OTHER_RAIL_COPY.title}
      subtitle={EXPLORE_OTHER_RAIL_COPY.subtitle}
      ariaLabel={EXPLORE_OTHER_RAIL_COPY.ariaLabel}
      sectionClass={RAIL_SECTION_FOLLOW}
      viewAllHref={EXPLORE_OTHER_RAIL_COPY.viewAllHref}
    />
  );
}

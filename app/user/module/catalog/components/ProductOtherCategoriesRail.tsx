import { ProductPdpProductRail } from '@/module/catalog/components/ProductPdpProductRail';
import { EXPLORE_OTHER_RAIL_COPY } from '@/module/catalog/lib/product-category-rails';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';

type ProductOtherCategoriesRailProps = {
  items: HomeCatalogProduct[];
  loading?: boolean;
  stackedBelowRail?: boolean;
};

export function ProductOtherCategoriesRail({
  items,
  loading,
  stackedBelowRail,
}: ProductOtherCategoriesRailProps) {
  return (
    <ProductPdpProductRail
      title={EXPLORE_OTHER_RAIL_COPY.title}
      subtitle={EXPLORE_OTHER_RAIL_COPY.subtitle}
      items={items}
      loading={loading}
      stackedBelowRail={stackedBelowRail}
      viewAllHref={EXPLORE_OTHER_RAIL_COPY.viewAllHref}
      viewAllLabel={EXPLORE_OTHER_RAIL_COPY.viewAllLabel}
    />
  );
}

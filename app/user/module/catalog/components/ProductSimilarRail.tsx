import { ProductPdpProductRail } from '@/module/catalog/components/ProductPdpProductRail';
import { resolveSimilarPackagesMeta } from '@/module/catalog/lib/product-category-rails';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useMemo } from 'react';

type ProductSimilarRailProps = {
  items: HomeCatalogProduct[];
  loading?: boolean;
  categoryId?: string | null;
};

export function ProductSimilarRail({ items, loading, categoryId }: ProductSimilarRailProps) {
  const { categories } = useHomeCategories();

  const viewAll = useMemo(
    () => resolveSimilarPackagesMeta(categoryId, categories),
    [categoryId, categories],
  );

  return (
    <ProductPdpProductRail
      title="You may also like"
      subtitle="Explore more décor in this category"
      items={items}
      loading={loading}
      viewAllHref={viewAll?.viewAllHref}
      viewAllLabel={viewAll?.viewAllLabel}
    />
  );
}

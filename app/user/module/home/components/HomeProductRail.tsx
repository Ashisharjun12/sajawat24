import { ProductRailHeader } from '@/module/catalog/components/ProductRailHeader';
import { resolveRailViewAllHref } from '@/module/catalog/lib/product-category-rails';
import { CatalogProductCardRail } from '@/module/catalog/components/CatalogProductCard';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import type { HomeProductSection } from '@/module/home/lib/home-catalog';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

type HomeProductRailProps = {
  section: HomeProductSection;
  showTitle?: boolean;
  showSubtitle?: boolean;
  loading?: boolean;
};

export function HomeProductRail({
  section,
  showTitle = true,
  showSubtitle = true,
  loading = false,
}: HomeProductRailProps) {
  const { categories } = useHomeCategories();

  const viewAllHref = useMemo(
    () => resolveRailViewAllHref(section.items, categories),
    [section.items, categories],
  );

  /** Section merchandising label (Trending, Most popular) — same as web `badgeLabel ?? name`. */
  const railBadgeLabel = section.badgeLabel ?? section.title;
  const railBadgeColor = section.badgeColor ?? null;
  const showHeader =
    showTitle ||
    (showSubtitle && section.subtitle) ||
    (!loading && Boolean(viewAllHref));

  return (
    <View className="gap-3">
      {showHeader ? (
        <View className="px-4">
          <ProductRailHeader
            title={showTitle ? section.title : undefined}
            subtitle={showSubtitle ? section.subtitle : undefined}
            viewAllHref={loading ? undefined : viewAllHref}
          />
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-4">
        {section.items.map((product) => (
          <CatalogProductCardRail
            key={product.id}
            product={product}
            badgeLabel={railBadgeLabel}
            badgeColor={railBadgeColor}
          />
        ))}
      </ScrollView>
    </View>
  );
}

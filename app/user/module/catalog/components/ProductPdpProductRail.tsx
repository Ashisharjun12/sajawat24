import { ProductRailHeader } from '@/module/catalog/components/ProductRailHeader';
import { CatalogProductCard } from '@/module/catalog/components/CatalogProductCard';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { cn } from '@/lib/utils';
import { type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

const PDP_RAIL_CARD_WIDTH = 168;

type ProductPdpProductRailProps = {
  title: string;
  subtitle: string;
  items: HomeCatalogProduct[];
  loading?: boolean;
  viewAllHref?: Href | null;
  viewAllLabel?: string;
  /** Tighter top spacing when this rail follows another PDP product rail */
  stackedBelowRail?: boolean;
  className?: string;
};

function sectionSpacingClass(stackedBelowRail?: boolean) {
  return stackedBelowRail
    ? 'mt-4 gap-3 border-t border-border/60 pt-5'
    : 'gap-3 border-t border-border/60 pt-8';
}

export function ProductPdpProductRail({
  title,
  subtitle,
  items,
  loading,
  viewAllHref,
  viewAllLabel,
  stackedBelowRail,
  className,
}: ProductPdpProductRailProps) {
  if (loading) {
    return (
      <View className={cn(sectionSpacingClass(stackedBelowRail), className)}>
        <ProductRailHeader title={title} subtitle={subtitle} />
        <View
          className="h-[248px] rounded-2xl bg-muted"
          style={{ width: PDP_RAIL_CARD_WIDTH }}
        />
      </View>
    );
  }

  if (!items.length) return null;

  return (
    <View className={cn(sectionSpacingClass(stackedBelowRail), className)}>
      <ProductRailHeader
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pr-1">
        {items.map((product) => (
          <View key={product.id} style={{ width: PDP_RAIL_CARD_WIDTH }}>
            <CatalogProductCard product={product} layout="rail" className="w-full" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

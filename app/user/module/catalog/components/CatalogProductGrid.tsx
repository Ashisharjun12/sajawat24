import {
  CatalogProductCard,
  CatalogProductCardSkeleton,
} from '@/module/catalog/components/CatalogProductCard';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { View } from 'react-native';

type CatalogProductGridProps = {
  products: HomeCatalogProduct[];
};

export function CatalogProductGrid({ products }: CatalogProductGridProps) {
  const rows: HomeCatalogProduct[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <View className="gap-6">
      {rows.map((row) => (
        // Keyed by the row's products (not its index) so appending a page never re-uses
        // an old row's native view for different products.
        <View key={row.map((p) => p.id).join('|')} className="flex-row gap-3">
          {row.map((product) => (
            // No `h-full` / `self-stretch`: a percentage height inside a row whose height comes
            // from its own content is what made rows measure short and overlap. The card text
            // blocks have fixed heights, so cards in a row are the same height anyway.
            <View key={product.id} className="min-w-0 flex-1">
              <CatalogProductCard product={product} layout="grid" className="flex-none" />
            </View>
          ))}
          {row.length === 1 ? <View className="min-w-0 flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

/** Placeholder cards, 2 per row. `rows` defaults to a full first-load screen. */
export function CatalogProductGridSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-6">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3">
          <View className="min-w-0 flex-1">
            <CatalogProductCardSkeleton layout="grid" />
          </View>
          <View className="min-w-0 flex-1">
            <CatalogProductCardSkeleton layout="grid" />
          </View>
        </View>
      ))}
    </View>
  );
}

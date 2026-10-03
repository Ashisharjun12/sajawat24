import { CatalogProductCard } from '@/module/catalog/components/CatalogProductCard';
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
    <View className="gap-2.5">
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row gap-2.5">
          {row.map((product) => (
            <View key={product.id} className="min-w-0 flex-1">
              <CatalogProductCard product={product} layout="grid" />
            </View>
          ))}
          {row.length === 1 ? <View className="min-w-0 flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

export function CatalogProductGridSkeleton() {
  return (
    <View className="gap-2.5">
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-2.5">
          <View className="min-w-0 flex-1 aspect-square rounded-2xl bg-muted" />
          <View className="min-w-0 flex-1 aspect-square rounded-2xl bg-muted" />
        </View>
      ))}
    </View>
  );
}

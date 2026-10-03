import { CatalogProductCardSkeleton } from '@/module/catalog/components/CatalogProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeProductRail } from '@/module/home/components/HomeProductRail';
import type { HomeProductSection } from '@/module/home/lib/home-catalog';
import { ScrollView, View } from 'react-native';

type HomeProductRailsProps = {
  sections: HomeProductSection[];
  loading?: boolean;
};

function HomeProductRailSkeleton() {
  return (
    <View className="gap-3">
      <View className="gap-2 px-4">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CatalogProductCardSkeleton key={i} layout="rail" />
        ))}
      </ScrollView>
    </View>
  );
}

export function HomeProductRails({ sections, loading = false }: HomeProductRailsProps) {
  if (!loading && sections.length === 0) {
    return null;
  }

  if (loading && sections.length === 0) {
    return (
      <View className="gap-10">
        <HomeProductRailSkeleton />
      </View>
    );
  }

  return (
    <View className="gap-10">
      {sections.map((section) => (
        <HomeProductRail key={section.id} section={section} loading={loading} />
      ))}
    </View>
  );
}

import { Text } from '@/components/ui/text';
import { ProductStarRow } from '@/module/catalog/components/product-detail/reviews/ProductStarRow';
import { View } from 'react-native';

export type ReviewsSummaryData = {
  ratingAvg?: number | null;
  reviewCount?: number;
  distribution?: Record<string | number, number>;
};

function distributionPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

type ProductReviewsSummaryProps = {
  summary: ReviewsSummaryData | null;
};

export function ProductReviewsSummary({ summary }: ProductReviewsSummaryProps) {
  const ratingAvg = summary?.ratingAvg;
  const reviewCount = summary?.reviewCount ?? 0;
  const distribution = summary?.distribution ?? {};

  if (!reviewCount) return null;

  const rows = [5, 4, 3, 2, 1];

  return (
    <View className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <View className="gap-5">
        <View>
          <Text className="text-foreground text-4xl font-semibold tabular-nums tracking-tight">
            {ratingAvg != null ? Number(ratingAvg).toFixed(1) : '—'}
          </Text>
          <ProductStarRow rating={ratingAvg ?? 0} size="lg" className="mt-1" />
          <Text className="text-muted-foreground mt-1 text-sm">
            {reviewCount.toLocaleString('en-IN')} review{reviewCount === 1 ? '' : 's'}
          </Text>
        </View>

        <View className="gap-2">
          {rows.map((stars) => {
            const count = distribution[stars] ?? distribution[String(stars)] ?? 0;
            const percent = distributionPercent(Number(count), reviewCount);
            return (
              <View key={stars} className="flex-row items-center gap-2">
                <Text className="text-muted-foreground w-8 text-xs">{stars}</Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${percent}%` }}
                  />
                </View>
                <Text className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                  {percent}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

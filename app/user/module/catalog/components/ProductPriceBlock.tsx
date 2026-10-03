import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { View } from 'react-native';

type ProductPriceBlockProps = {
  pricePaise: number;
  compareAtPaise?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
};

function formatRating(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export function ProductPriceBlock({
  pricePaise,
  compareAtPaise,
  rating,
  reviewCount,
}: ProductPriceBlockProps) {
  const savedPaise =
    compareAtPaise != null && compareAtPaise > pricePaise ? compareAtPaise - pricePaise : 0;
  const percentOff =
    compareAtPaise != null && compareAtPaise > pricePaise
      ? Math.round((1 - pricePaise / compareAtPaise) * 100)
      : 0;
  const ratingLabel =
    rating != null && Number.isFinite(rating) ? formatRating(rating) : null;
  const reviews =
    reviewCount != null && reviewCount > 0 ? reviewCount.toLocaleString('en-IN') : null;

  return (
    <View className="gap-2.5 border-b border-border/60 pb-5">
      {ratingLabel || reviews ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {ratingLabel ? (
            <View className="rounded-md bg-emerald-600 px-2 py-0.5">
              <Text className="text-xs font-bold text-white">★ {ratingLabel}</Text>
            </View>
          ) : null}
          {reviews ? <Text className="text-muted-foreground text-sm">{reviews} reviews</Text> : null}
          {ratingLabel ? <Text className="text-muted-foreground text-sm">· Verified</Text> : null}
        </View>
      ) : null}
      <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Text className="text-foreground text-3xl font-extrabold">{formatPaise(pricePaise)}</Text>
        {compareAtPaise != null && compareAtPaise > pricePaise ? (
          <Text className="text-muted-foreground text-base line-through">
            {formatPaise(compareAtPaise)}
          </Text>
        ) : null}
        {percentOff > 0 ? (
          <Text className="text-sm font-bold text-emerald-600">{percentOff}% OFF</Text>
        ) : null}
      </View>
      {savedPaise > 0 ? (
        <Text className="text-sm leading-relaxed">
          <Text className="font-semibold text-emerald-700">You save {formatPaise(savedPaise)}</Text>
          <Text className="text-muted-foreground"> · Inclusive of all charges & setup</Text>
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm">Inclusive of all charges & setup</Text>
      )}
    </View>
  );
}

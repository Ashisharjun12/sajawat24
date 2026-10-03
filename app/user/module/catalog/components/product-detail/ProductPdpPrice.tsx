import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import { formatPdpRating } from '@/module/catalog/lib/product-pdp-helpers';
import { BadgeCheck } from 'lucide-react-native';
import { View } from 'react-native';

type ProductPdpPriceProps = {
  pricePaise: number | null | undefined;
  compareAtPaise?: number | null;
  ratingAvg?: number | null;
  reviewCount?: number | null;
};

export function ProductPdpPrice({
  pricePaise,
  compareAtPaise,
  ratingAvg,
  reviewCount,
}: ProductPdpPriceProps) {
  if (pricePaise == null) {
    return <Text className="text-muted-foreground text-sm">Price unavailable</Text>;
  }

  const percentOff = discountPercent(pricePaise, compareAtPaise);
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const savedPaise = hasCompare ? compareAtPaise! - pricePaise : 0;
  const ratingLabel = formatPdpRating(ratingAvg);
  const reviews =
    reviewCount != null && Number(reviewCount) > 0
      ? Number(reviewCount).toLocaleString('en-IN')
      : null;

  return (
    <View className="gap-2.5 border-b border-border/60 pb-5">
      {ratingLabel != null || reviews ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {ratingLabel != null ? (
            <View className="rounded-md bg-emerald-600 px-2 py-0.5">
              <Text className="text-xs font-bold text-white">★ {ratingLabel}</Text>
            </View>
          ) : null}
          {reviews ? <Text className="text-muted-foreground text-sm">{reviews} reviews</Text> : null}
          {ratingLabel != null ? (
            <View className="flex-row items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 dark:bg-sky-950/40">
              <Icon as={BadgeCheck} className="size-3.5 text-sky-600 dark:text-sky-400" />
              <Text className="text-xs font-semibold text-sky-700 dark:text-sky-300">Verified</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Text className="text-foreground text-3xl font-extrabold tabular-nums tracking-tight">
          {formatPaise(pricePaise)}
        </Text>
        {hasCompare ? (
          <Text className="text-muted-foreground text-base line-through tabular-nums">
            {formatPaise(compareAtPaise!)}
          </Text>
        ) : null}
        {percentOff > 0 ? (
          <Text className="text-sm font-bold text-emerald-600">{percentOff}% OFF</Text>
        ) : null}
      </View>
      {savedPaise > 0 ? (
        <Text className="text-sm leading-relaxed">
          <Text className="font-semibold text-emerald-700">
            You save {formatPaise(savedPaise)}
          </Text>
          <Text className="text-muted-foreground"> · Inclusive of all charges & setup</Text>
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm">Inclusive of all charges & setup</Text>
      )}
    </View>
  );
}

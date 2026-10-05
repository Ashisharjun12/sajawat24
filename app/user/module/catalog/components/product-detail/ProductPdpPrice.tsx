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
            <View className="rounded-md bg-success px-2 py-0.5">
              <Text className="text-xs font-bold text-white">★ {ratingLabel}</Text>
            </View>
          ) : null}
          {reviews ? <Text className="text-muted-foreground text-sm">{reviews} reviews</Text> : null}
          {ratingLabel != null ? (
            <View className="flex-row items-center gap-1 rounded-md bg-primary-tint px-1.5 py-0.5">
              <Icon as={BadgeCheck} className="size-3.5 text-primary" />
              <Text className="text-xs font-semibold text-primary">Verified</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Text className="text-foreground text-display font-semibold tabular-nums">
          {formatPaise(pricePaise)}
        </Text>
        {hasCompare ? (
          <Text className="text-muted-foreground text-base line-through tabular-nums">
            {formatPaise(compareAtPaise!)}
          </Text>
        ) : null}
        {percentOff > 0 ? (
          <Text className="text-sm font-bold text-success">{percentOff}% OFF</Text>
        ) : null}
      </View>
      {savedPaise > 0 ? (
        <Text className="text-sm leading-relaxed">
          <Text className="font-semibold text-success">
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

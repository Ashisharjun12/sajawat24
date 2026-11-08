import {
  PDP_CHIP_HEIGHT,
  PDP_CHIP_RADIUS,
  ProductPdpDeliveryChip,
} from './ProductPdpDeliveryChip';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import { formatPdpRating } from '@/module/catalog/lib/product-pdp-helpers';
import { ShieldCheck, Star } from 'lucide-react-native';
import { View } from 'react-native';

/** Rating star yellow (PDP rating pill). */
const RATING_STAR_HEX = '#F5B301';
/** "33% OFF" next to the price — darker green than the default success tone. */
const DISCOUNT_TEXT_HEX = '#166534';

type ProductPdpPriceProps = {
  pricePaise: number | null | undefined;
  compareAtPaise?: number | null;
  ratingAvg?: number | null;
  reviewCount?: number | null;
  /** Lets the Free delivery chip alternate with the product's section badge. */
  productId?: string | null;
  /** Adds an "Instant" face to the chip rotation when the product offers Instant. */
  instant?: { enabled?: boolean; badgeLabel?: string | null } | null;
};

/** Verified chip: light green fill + green text, with a blue shield (white tick). */
const GREEN_CHIP_BG_HEX = '#DCFCE7';
const GREEN_CHIP_TEXT_HEX = '#15803D';
const SHIELD_BLUE_HEX = '#2563EB';

function VerifiedChip() {
  return (
    <View
      className="flex-row items-center gap-1 px-2"
      style={{
        height: PDP_CHIP_HEIGHT,
        borderRadius: PDP_CHIP_RADIUS,
        backgroundColor: GREEN_CHIP_BG_HEX,
      }}>
      <ShieldCheck size={16} color="#FFFFFF" fill={SHIELD_BLUE_HEX} strokeWidth={2.25} />
      <Text
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: GREEN_CHIP_TEXT_HEX }}>
        Verified
      </Text>
    </View>
  );
}

function RatingPill({ ratingLabel, reviews }: { ratingLabel: string | null; reviews: string | null }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1"
      accessibilityLabel={[
        ratingLabel != null ? `Rated ${ratingLabel}` : null,
        reviews ? `${reviews} reviews` : null,
      ]
        .filter(Boolean)
        .join(', ')}>
      {ratingLabel != null ? (
        <>
          <Star size={14} color={RATING_STAR_HEX} fill={RATING_STAR_HEX} />
          <Text className="text-foreground text-sm font-medium tabular-nums">{ratingLabel}</Text>
        </>
      ) : null}
      {ratingLabel != null && reviews ? <View className="h-3.5 w-px bg-border" /> : null}
      {reviews ? <Text className="text-muted-foreground text-sm tabular-nums">{reviews}</Text> : null}
    </View>
  );
}

export function ProductPdpPrice({
  pricePaise,
  compareAtPaise,
  ratingAvg,
  reviewCount,
  productId,
  instant,
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
  const hasRating = ratingLabel != null || reviews != null;

  return (
    <View className="gap-2.5 border-b border-border/60 pb-5">
      {/* Free delivery chip on the left; Verified + rating pill on the right. */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 shrink flex-row items-center">
          <ProductPdpDeliveryChip productId={productId} instant={instant} />
        </View>
        {/* Verified sits just left of the rating pill. */}
        <View className="shrink-0 flex-row items-center gap-2">
          {ratingLabel != null ? <VerifiedChip /> : null}
          {hasRating ? <RatingPill ratingLabel={ratingLabel} reviews={reviews} /> : null}
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <Text className="text-foreground text-2xl font-semibold tabular-nums">
          {formatPaise(pricePaise)}
        </Text>
        {hasCompare ? (
          <Text className="text-muted-foreground text-base line-through tabular-nums">
            {formatPaise(compareAtPaise!)}
          </Text>
        ) : null}
        {percentOff > 0 ? (
          <Text className="text-sm font-semibold" style={{ color: DISCOUNT_TEXT_HEX }}>
            {percentOff}% OFF
          </Text>
        ) : null}
      </View>

      {savedPaise > 0 ? (
        <Text className="text-sm leading-relaxed">
          <Text className="font-semibold text-success">You save {formatPaise(savedPaise)}</Text>
          <Text className="text-muted-foreground"> · Inclusive of all charges & setup</Text>
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm">Inclusive of all charges & setup</Text>
      )}
    </View>
  );
}

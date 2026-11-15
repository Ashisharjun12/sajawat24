import {
  PDP_CHIP_HEIGHT,
  PDP_CHIP_RADIUS,
  ProductPdpDeliveryChip,
} from './ProductPdpDeliveryChip';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import { formatPdpRating } from '@/module/catalog/lib/product-pdp-helpers';
import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';
/** "33% OFF" next to the price — darker green than the default success tone. */
const DISCOUNT_TEXT_HEX = '#166534';

type ProductPdpPriceProps = {
  pricePaise: number | null | undefined;
  compareAtPaise?: number | null;
  /** Shows the Verified chip when the product has a rating. */
  ratingAvg?: number | null;
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

export function ProductPdpPrice({
  pricePaise,
  compareAtPaise,
  ratingAvg,
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

  return (
    <View className="gap-2.5 border-b border-border/60 pb-5">
      {/* Free delivery chip on the left; Verified on the right. Rating pill lives on the photo. */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 shrink flex-row items-center">
          <ProductPdpDeliveryChip productId={productId} instant={instant} />
        </View>
        {ratingLabel != null ? (
          <View className="shrink-0 flex-row items-center">
            <VerifiedChip />
          </View>
        ) : null}
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

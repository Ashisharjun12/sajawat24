import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { formatPdpRating } from '@/module/catalog/lib/product-pdp-helpers';
import { Star } from 'lucide-react-native';
import { View } from 'react-native';

/** Rating star yellow (PDP rating pill). */
const RATING_STAR_HEX = '#F5B301';

type ProductPdpRatingPillProps = {
  ratingAvg?: number | null;
  reviewCount?: number | null;
  /** Opens the Ratings & reviews section. */
  onPress?: () => void;
};

/** "★ 4.8 | 120" pill on the PDP photo, above the Similar button. Renders nothing without a rating. */
export function ProductPdpRatingPill({ ratingAvg, reviewCount, onPress }: ProductPdpRatingPillProps) {
  const ratingLabel = formatPdpRating(ratingAvg);
  const reviews =
    reviewCount != null && Number(reviewCount) > 0
      ? Number(reviewCount).toLocaleString('en-IN')
      : null;
  if (ratingLabel == null && reviews == null) return null;

  return (
    <ScalePressable
      onPress={onPress}
      disabled={!onPress}
      haptic
      hitSlop={6}
      className="flex-row items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 shadow-md"
      accessibilityRole="button"
      accessibilityLabel={[
        ratingLabel != null ? `Rated ${ratingLabel}` : null,
        reviews ? `${reviews} reviews` : null,
        'Open reviews',
      ]
        .filter(Boolean)
        .join(', ')}>
      {ratingLabel != null ? (
        <>
          <Star size={14} color={RATING_STAR_HEX} fill={RATING_STAR_HEX} />
          <Text className="text-foreground text-sm font-semibold tabular-nums">{ratingLabel}</Text>
        </>
      ) : null}
      {ratingLabel != null && reviews ? <View className="h-3.5 w-px bg-border" /> : null}
      {reviews ? <Text className="text-muted-foreground text-sm tabular-nums">{reviews}</Text> : null}
    </ScalePressable>
  );
}

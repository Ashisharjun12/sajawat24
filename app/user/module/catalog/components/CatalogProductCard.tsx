import { ScalePressable } from '@/components/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { sectionBadgeAppearance } from '@/lib/section-badge-color';
import { cn } from '@/lib/utils';
import { ProductCardInstantTag } from '@/module/catalog/components/ProductCardInstant';
import { ProductCardWishlistButton } from '@/module/catalog/components/ProductCardWishlistButton';
import { discountPercent } from '@/lib/product-price';
import {
  resolveCardBadges,
  useProductMerchBadge,
} from '@/module/catalog/hooks/use-product-merch-badge';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { DiscountTagSvg } from '@/module/catalog/components/DiscountTagSvg';
import { type Href, router } from 'expo-router';
import { RIBBON_FOLD, RibbonBadge } from '@/module/catalog/components/RibbonBadge';
import { View } from 'react-native';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop';

const RAIL_WIDTH_CLASS = 'w-[168px]';

/** Two-line title, fixed height so every card's price row starts at the same y. */
const PRODUCT_CARD_TITLE_CLASS = 'text-foreground h-9 text-[13px] font-medium leading-[18px]';

export type CatalogProductCardLayout = 'rail' | 'grid';

export type CatalogProductCardProps = {
  product: HomeCatalogProduct;
  layout?: CatalogProductCardLayout;
  badgeLabel?: string | null;
  badgeColor?: string | null;
  onPress?: () => void;
  className?: string;
};

function ProductSectionBadge({
  label,
  color,
}: {
  label?: string | null;
  color?: string | null;
}) {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  const { backgroundColor } = sectionBadgeAppearance(color ?? 'amber');

  // Wrap-around ribbon hanging just past the photo's right edge.
  return (
    <View className="absolute top-2 z-10 max-w-[85%]" style={{ right: -RIBBON_FOLD }}>
      <RibbonBadge label={trimmed} color={backgroundColor} />
    </View>
  );
}

function formatRating(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function resolveReviewCount(reviewCount: number | null | undefined): number | null {
  const n = reviewCount != null ? Number(reviewCount) : 0;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function ProductCardRatingReviews({
  ratingLabel,
  reviewCount,
  size = 'default',
}: {
  ratingLabel: string | null;
  reviewCount: number | null;
  size?: 'rail' | 'default';
}) {
  const positiveCount = resolveReviewCount(reviewCount);
  if (ratingLabel == null && positiveCount == null) return null;
  const countLabel = positiveCount != null ? positiveCount.toLocaleString('en-IN') : null;
  const textSize = size === 'rail' ? 'text-[11px]' : 'text-xs';

  return (
    <View
      className="min-h-5 min-w-0 shrink flex-row items-center gap-1"
      accessibilityLabel={[
        ratingLabel != null ? `Rated ${ratingLabel}` : null,
        countLabel != null ? `${countLabel} ${positiveCount === 1 ? 'review' : 'reviews'}` : null,
      ]
        .filter(Boolean)
        .join(', ')}>
      {ratingLabel != null ? (
        <>
          <Text className={cn('font-bold leading-none text-success', textSize)}>★</Text>
          <Text className={cn('font-semibold leading-none text-foreground tabular-nums', textSize)}>
            {ratingLabel}
          </Text>
        </>
      ) : null}
      {ratingLabel != null && countLabel != null ? (
        <View className="mx-1 h-3 w-px bg-border" />
      ) : null}
      {countLabel != null ? (
        <Text
          className={cn('shrink leading-none text-muted-foreground tabular-nums', textSize)}
          numberOfLines={1}>
          {countLabel}
        </Text>
      ) : null}
    </View>
  );
}

function ProductCardReviewsAndEta({
  ratingLabel,
  reviewCount,
  instant,
  size = 'rail',
  reserveSpace = false,
}: {
  ratingLabel: string | null;
  reviewCount: number | null;
  instant?: HomeCatalogProduct['instant'];
  size?: 'rail' | 'default';
  reserveSpace?: boolean;
}) {
  const showInstant = Boolean(instant?.enabled);
  const hasReviews =
    ratingLabel != null || resolveReviewCount(reviewCount) != null;

  if (!hasReviews && !showInstant && !reserveSpace) return null;

  // Rating first, then the Instant tag right after it with a small gap.
  return (
    <View
      className={cn(
        'flex-row items-center gap-2',
        reserveSpace ? 'h-5' : 'mt-1.5 min-h-5',
      )}>
      {hasReviews ? (
        <View className="min-w-0 shrink flex-row items-center overflow-hidden">
          <ProductCardRatingReviews
            size={size}
            ratingLabel={ratingLabel}
            reviewCount={reviewCount}
          />
        </View>
      ) : null}
      {showInstant ? (
        <ProductCardInstantTag instant={instant} className={hasReviews ? 'ml-1.5' : undefined} />
      ) : null}
    </View>
  );
}

/**
 * Fixed sizes for every card (grid + rail) so price and tag never differ between cards.
 * MRP 12 · price 14 · tag 10 — fits "₹2,349 ₹2,049 13% OFF" in a 2-column phone grid.
 */
const PRICE_SIZE = 14;
const MRP_SIZE = 12;
const DISCOUNT_TAG_SIZE = 10;

/** MRP (struck) → selling price → discount tag, always on one line. */
function ProductCardPriceBlock({
  pricePaise,
  compareAtPaise,
}: {
  pricePaise: number;
  compareAtPaise?: number | null;
}) {
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const percentOff = discountPercent(pricePaise, compareAtPaise);

  return (
    <View className="mt-1 h-6 min-w-0 flex-row flex-nowrap items-center gap-1 overflow-hidden">
      {hasCompare ? (
        <Text
          className="shrink text-muted-foreground line-through tabular-nums"
          style={{ fontSize: MRP_SIZE, lineHeight: 16 }}
          numberOfLines={1}>
          {formatPaise(compareAtPaise!)}
        </Text>
      ) : null}
      <Text
        className="shrink-0 font-semibold tabular-nums text-foreground"
        style={{ fontSize: PRICE_SIZE, lineHeight: 18 }}
        numberOfLines={1}>
        {formatPaise(pricePaise)}
      </Text>
      {percentOff > 0 ? (
        <View className="ml-0.5 shrink-0">
          <DiscountTagSvg percentOff={percentOff} fontSize={DISCOUNT_TAG_SIZE} />
        </View>
      ) : null}
    </View>
  );
}

export function CatalogProductCard({
  product,
  layout = 'grid',
  badgeLabel,
  badgeColor,
  onPress,
  className,
}: CatalogProductCardProps) {
  const isRail = layout === 'rail';

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/(app)/product/${product.id}` as Href);
  }

  const imageUri = product.imageUrl ?? PLACEHOLDER;
  const ratingLabel = formatRating(product.rating);
  const fromStore = useProductMerchBadge(product.id);
  const resolved = resolveCardBadges({ badgeLabel, badgeColor, fromStore });

  return (
    <ScalePressable
      onPress={handlePress}
      haptic
      className={cn('flex-col', isRail ? RAIL_WIDTH_CLASS : 'w-full flex-1', className)}
      accessibilityRole="button"
      accessibilityLabel={product.title}>
      {/* Outer box does not clip, so the ribbon can wrap past the photo edge. */}
      <View className="relative aspect-square w-full shrink-0">
        <View className="h-full w-full overflow-hidden rounded-xl bg-muted">
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={product.title}
          />
          <ProductCardWishlistButton product={product} className="left-2 top-2" />
        </View>
        <ProductSectionBadge label={resolved.badgeLabel} color={resolved.badgeColor} />
      </View>
      <View className="flex flex-1 shrink-0 flex-col pt-2">
        <Text className={PRODUCT_CARD_TITLE_CLASS} numberOfLines={2}>
          {product.title}
        </Text>

        <ProductCardPriceBlock
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />

        <View className="mt-auto shrink-0 pt-0.5">
          <View className="h-5 justify-center">
            <ProductCardReviewsAndEta
              size="default"
              ratingLabel={ratingLabel}
              reviewCount={product.reviewCount}
              instant={product.instant}
              reserveSpace
            />
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}

type CatalogProductCardRailProps = Omit<CatalogProductCardProps, 'layout'>;

export function CatalogProductCardRail(props: CatalogProductCardRailProps) {
  return <CatalogProductCard {...props} layout="rail" />;
}

export function CatalogProductCardSkeleton({ layout = 'rail' }: { layout?: CatalogProductCardLayout }) {
  const widthClass = layout === 'rail' ? RAIL_WIDTH_CLASS : 'w-full';
  return (
    <View className={widthClass}>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <View className="flex flex-col pt-2">
        <Skeleton className="h-9 w-[88%] rounded-md" />
        <View className="mt-1 h-6 flex-row items-center gap-1.5">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </View>
        <View className="mt-0.5 h-5 flex-row items-center gap-1.5">
          <Skeleton className="h-3 w-16 rounded-md" />
        </View>
      </View>
    </View>
  );
}

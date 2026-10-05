import { ScalePressable } from '@/components/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { sectionBadgeAppearance } from '@/lib/section-badge-color';
import { cn } from '@/lib/utils';
import {
  ProductCardDiscountBadge,
  ProductCardInstantImageBadge,
  ProductCardInstantLine,
} from '@/module/catalog/components/ProductCardInstant';
import {
  resolveCardBadges,
  useProductMerchBadge,
} from '@/module/catalog/hooks/use-product-merch-badge';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { View } from 'react-native';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop';

const RAIL_WIDTH_CLASS = 'w-[168px]';

/** Two-line title — matches web `HomeProductCard` `PRODUCT_CARD_TITLE_CLASS`. */
const PRODUCT_CARD_TITLE_CLASS =
  'text-foreground min-h-[2.75em] text-[13px] font-bold leading-snug tracking-tight';

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
  const { className, backgroundColor } = sectionBadgeAppearance(color ?? 'amber');
  return (
    <View
      className={cn(
        'absolute right-2 top-2 z-10 max-w-[85%] rounded-md px-2 py-0.5 shadow-sm',
        className,
      )}
      style={{ backgroundColor }}>
      <Text className="text-[10px] font-bold leading-tight text-white" numberOfLines={1}>
        {trimmed}
      </Text>
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
  const reviewSize = size === 'rail' ? 'text-[11px]' : 'text-xs';

  return (
    <View className="min-h-5 min-w-0 flex-1 flex-row items-center gap-1.5">
      {ratingLabel != null ? (
        <View className="rounded-md bg-success px-1.5 py-0.5">
          <Text className="text-[11px] font-bold leading-none text-white">★ {ratingLabel}</Text>
        </View>
      ) : null}
      {countLabel != null ? (
        <Text className={cn('text-muted-foreground shrink', reviewSize)} numberOfLines={1}>
          {countLabel} {positiveCount === 1 ? 'review' : 'reviews'}
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
  const instantOnImage = Boolean(instant?.enabled && instant.showBadge);
  const showInstantMeta =
    Boolean(instant?.enabled) &&
    !instantOnImage &&
    (Boolean(instant.showBadge) || instant.etaMinutes != null);
  const hasReviews =
    ratingLabel != null || resolveReviewCount(reviewCount) != null;

  if (!hasReviews && !showInstantMeta && !reserveSpace) return null;

  return (
    <View
      className={cn(
        'flex-row items-center justify-between gap-2',
        reserveSpace ? 'h-5' : 'mt-1.5 min-h-5',
      )}>
      <View className="min-w-0 flex-1 flex-row items-center overflow-hidden">
        {hasReviews ? (
          <ProductCardRatingReviews
            size={size}
            ratingLabel={ratingLabel}
            reviewCount={reviewCount}
          />
        ) : null}
      </View>
      {showInstantMeta ? (
        <ProductCardInstantLine instant={instant} size={size} />
      ) : null}
    </View>
  );
}

function ProductCardPriceBlock({
  pricePaise,
  compareAtPaise,
  size = 'default',
}: {
  pricePaise: number;
  compareAtPaise?: number | null;
  size?: 'rail' | 'default';
}) {
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const priceClass =
    size === 'rail' ? 'text-[15px]' : 'text-base';
  const mrpClass = size === 'rail' ? 'text-[11px]' : 'text-xs';
  const wrapClass = size === 'rail' ? 'pt-1.5 min-h-6' : 'mt-auto pt-2';

  return (
    <View className={wrapClass}>
      <View className="min-h-6 min-w-0 flex-row flex-nowrap items-center gap-1">
        <Text className={cn('shrink-0 font-extrabold tabular-nums text-foreground', priceClass)}>
          {formatPaise(pricePaise)}
        </Text>
        {hasCompare ? (
          <Text
            className={cn(
              'shrink-0 font-medium text-muted-foreground line-through tabular-nums',
              mrpClass,
            )}>
            {formatPaise(compareAtPaise!)}
          </Text>
        ) : null}
      </View>
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
  const cardSize = isRail ? 'rail' : 'default';

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
      className={cn(
        'flex-col rounded-card border border-border/80 bg-card shadow-raised',
        isRail ? RAIL_WIDTH_CLASS : 'w-full flex-1',
        className,
      )}
      accessibilityRole="button"
      accessibilityLabel={product.title}>
      <View className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-card bg-muted">
        <ProductSectionBadge label={resolved.badgeLabel} color={resolved.badgeColor} />
        <ProductCardDiscountBadge
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessibilityLabel={product.title}
        />
        <ProductCardInstantImageBadge instant={product.instant} />
      </View>
      <View
        className={cn(
          'flex shrink-0 flex-col',
          isRail ? 'px-2 pb-2.5 pt-2' : 'flex-1 px-2.5 pb-3 pt-2.5',
        )}>
        <Text className={PRODUCT_CARD_TITLE_CLASS} numberOfLines={2}>
          {product.title}
        </Text>

        <View className="mt-1.5 h-5 shrink-0 justify-center">
          <ProductCardReviewsAndEta
            size={cardSize}
            ratingLabel={ratingLabel}
            reviewCount={product.reviewCount}
            instant={product.instant}
            reserveSpace
          />
        </View>

        <ProductCardPriceBlock
          size={cardSize}
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />
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
    <View className={cn('overflow-hidden rounded-card border border-border bg-card', widthClass)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <View className="flex flex-col px-2 pb-2.5 pt-2 sm:px-2.5">
        <Skeleton className="min-h-[2.75em] w-[88%] rounded-md" />
        <View className="mt-1.5 h-5 flex-row items-center gap-1.5">
          <Skeleton className="h-5 w-10 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </View>
        <View className="min-h-6 flex-row items-center pt-1.5">
          <Skeleton className="h-5 w-[4.5rem] rounded-md" />
        </View>
      </View>
    </View>
  );
}

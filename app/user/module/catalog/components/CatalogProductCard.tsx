import { ScalePressable } from '@/components/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import { sectionBadgeAppearance } from '@/lib/section-badge-color';
import { cn } from '@/lib/utils';
import {
  ProductCardInstantBadge,
  ProductCardInstantEta,
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
}: {
  ratingLabel: string | null;
  reviewCount: number | null;
}) {
  const positiveCount = resolveReviewCount(reviewCount);
  if (ratingLabel == null && positiveCount == null) return null;
  const countLabel = positiveCount != null ? positiveCount.toLocaleString('en-IN') : null;

  return (
    <View className="min-h-5 min-w-0 flex-1 flex-row items-center gap-1.5">
      {ratingLabel != null ? (
        <View className="rounded-md bg-emerald-600 px-1.5 py-0.5">
          <Text className="text-[11px] font-bold leading-none text-white">★ {ratingLabel}</Text>
        </View>
      ) : null}
      {countLabel != null ? (
        <Text className="text-muted-foreground shrink text-[11px]" numberOfLines={1}>
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
}: {
  ratingLabel: string | null;
  reviewCount: number | null;
  instant?: HomeCatalogProduct['instant'];
}) {
  const showEta = Boolean(instant?.enabled && instant.etaMinutes != null);
  const hasReviews =
    ratingLabel != null || resolveReviewCount(reviewCount) != null;

  return (
    <View className="mt-1.5 h-5 flex-row items-center justify-between gap-2">
      <View className="min-w-0 flex-1 flex-row items-center overflow-hidden">
        {hasReviews ? (
          <ProductCardRatingReviews ratingLabel={ratingLabel} reviewCount={reviewCount} />
        ) : null}
      </View>
      {showEta ? <ProductCardInstantEta instant={instant} /> : null}
    </View>
  );
}

function ProductCardPriceBlock({
  pricePaise,
  compareAtPaise,
  layout,
}: {
  pricePaise: number;
  compareAtPaise?: number | null;
  layout: CatalogProductCardLayout;
}) {
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const isRail = layout === 'rail';

  if (isRail) {
    return (
      <View className="mt-2 gap-1">
        <View className="flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <Text className="text-foreground text-[15px] font-extrabold tabular-nums">
            {formatPaise(pricePaise)}
          </Text>
          {hasCompare ? (
            <Text className="text-muted-foreground text-[11px] font-medium line-through tabular-nums">
              {formatPaise(compareAtPaise!)}
            </Text>
          ) : null}
        </View>
        {percentOff > 0 ? (
          <View className="self-start rounded-md bg-emerald-50 px-1.5 py-0.5 dark:bg-emerald-950/40">
            <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {percentOff}% OFF
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mt-2 min-h-8 flex-row flex-wrap items-end justify-between gap-x-2 gap-y-1">
      <View className="min-w-0 flex-row flex-wrap items-baseline gap-x-1.5">
        <Text className="text-foreground text-[15px] font-extrabold tabular-nums">
          {formatPaise(pricePaise)}
        </Text>
        {hasCompare ? (
          <Text className="text-muted-foreground text-[11px] font-medium line-through tabular-nums">
            {formatPaise(compareAtPaise!)}
          </Text>
        ) : null}
      </View>
      {percentOff > 0 ? (
        <View className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 dark:bg-emerald-950/40">
          <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            {percentOff}% OFF
          </Text>
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
      className={cn(
        'border-border/80 overflow-hidden rounded-2xl border bg-card shadow-sm',
        isRail ? RAIL_WIDTH_CLASS : 'w-full',
        className,
      )}
      accessibilityRole="button"
      accessibilityLabel={product.title}>
      <View className="relative aspect-square w-full shrink-0 bg-muted">
        <ProductSectionBadge label={resolved.badgeLabel} color={resolved.badgeColor} />
        <ProductCardInstantBadge instant={product.instant} />
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessibilityLabel={product.title}
        />
      </View>
      <View className={cn('px-2.5 pt-2.5', isRail ? 'pb-2.5' : 'pb-3')}>
        <Text
          className="text-foreground h-[2.35em] text-xs font-semibold leading-snug"
          numberOfLines={2}>
          {product.title}
        </Text>

        <ProductCardReviewsAndEta
          ratingLabel={ratingLabel}
          reviewCount={product.reviewCount}
          instant={product.instant}
        />

        <ProductCardPriceBlock
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
          layout={layout}
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
    <View className={cn('overflow-hidden rounded-2xl border border-border', widthClass)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <View className="gap-2 p-3">
        <Skeleton className="h-3.5 w-[90%] rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </View>
    </View>
  );
}

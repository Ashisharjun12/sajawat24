import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { productPath } from "@/lib/catalog-path";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/product-price";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { SectionMerchBadge } from "@/components/section-merch-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerItem } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";
import { ProductCardInstantLine } from "@/module/catalog/components/ProductCardInstant";
import { WishlistHeartButton } from "@/module/catalog/components/WishlistHeartButton";
import {
  resolveCardBadges,
  useProductMerchBadge,
} from "@/module/home/hooks/use-product-merch-badge";

/** Two-line product name — matches catalog card weight/size (see HomeProductCard default). */
const PRODUCT_CARD_TITLE_CLASS =
  "line-clamp-2 min-h-[2.75em] font-heading text-[13px] font-bold leading-snug tracking-tight text-foreground";

function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function resolveReviewCount(reviewCount) {
  if (reviewCount == null) return null;
  const n = Number(reviewCount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function ProductCardRatingReviews({
  ratingLabel,
  reviewCount,
  size = "default",
  className,
  noTopMargin = false,
}) {
  const positiveCount = resolveReviewCount(reviewCount);
  if (ratingLabel == null && positiveCount == null) return null;
  const countLabel = positiveCount != null ? positiveCount.toLocaleString() : null;
  const reviewSize = size === "rail" ? "text-[11px]" : "text-xs";

  return (
    <div
      className={cn(
        "flex min-h-5 items-center gap-1.5",
        !noTopMargin && "mt-1.5",
        className,
      )}
    >
      {ratingLabel != null ? (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white",
          )}
        >
          <span aria-hidden>★</span>
          {ratingLabel}
        </span>
      ) : null}
      {countLabel != null ? (
        <span className={cn("shrink-0 whitespace-nowrap text-muted-foreground", reviewSize)}>
          {countLabel} {positiveCount === 1 ? "review" : "reviews"}
        </span>
      ) : null}
    </div>
  );
}

function ProductCardReviewsAndEta({
  ratingLabel,
  reviewCount,
  instant,
  size = "rail",
  reserveSpace = false,
}) {
  const showInstantMeta =
    Boolean(instant?.enabled) &&
    (Boolean(instant.showBadge) || instant.etaMinutes != null);
  const hasReviews = ratingLabel != null || resolveReviewCount(reviewCount) != null;
  if (!hasReviews && !showInstantMeta && !reserveSpace) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        reserveSpace ? "h-5" : "mt-1.5 min-h-5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        {hasReviews ? (
          <ProductCardRatingReviews
            size={size}
            ratingLabel={ratingLabel}
            reviewCount={reviewCount}
            noTopMargin
            className="min-w-0"
          />
        ) : null}
      </div>
      {showInstantMeta ? (
        <ProductCardInstantLine instant={instant} size={size} className="shrink-0" />
      ) : null}
    </div>
  );
}

function ProductCardPriceBlock({ pricePaise, compareAtPaise, size = "default" }) {
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  const priceClass =
    size === "rail"
      ? "text-sm font-extrabold tracking-tight sm:text-[15px]"
      : "text-base font-extrabold tracking-tight sm:text-lg";
  const mrpClass =
    size === "rail"
      ? "text-[10px] sm:text-[11px]"
      : "text-xs sm:text-[13px]";
  const offClass = size === "rail" ? "text-[10px] sm:text-[11px]" : "text-[11px]";

  const priceWrapClass =
    size === "rail" ? "pt-1.5" : "mt-auto pt-2";

  return (
    <div className={cn(priceWrapClass, size === "rail" && "min-h-6")}>
      {hasCompare ? (
        <span className="sr-only">
          Sale price {formatPaise(pricePaise)}, was {formatPaise(compareAtPaise)}
        </span>
      ) : null}
      <div className="flex min-h-6 min-w-0 flex-nowrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <span
            className={cn("shrink-0 tabular-nums text-foreground", priceClass)}
            aria-hidden={hasCompare ? true : undefined}
          >
            {formatPaise(pricePaise)}
          </span>
          {hasCompare ? (
            <span
              className={cn(
                "shrink-0 font-medium text-muted-foreground line-through tabular-nums",
                mrpClass,
              )}
              aria-hidden
            >
              {formatPaise(compareAtPaise)}
            </span>
          ) : null}
        </div>
        {percentOff > 0 ? (
          <span
            className={cn("shrink-0 font-bold tabular-nums text-primary", offClass)}
            aria-hidden={hasCompare ? true : undefined}
          >
            {percentOff}% off
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CompactProductCardContent({ product, onNavigate }) {
  const [broken, setBroken] = useState(false);
  const src = product.imageUrl ?? product.images?.[0]?.url;
  const ratingLabel = formatRating(product.rating);
  const fromStore = useProductMerchBadge(product.id);
  const { badgeLabel, badgeColor } = resolveCardBadges({ fromStore });

  return (
    <Link
      to={productPath(product)}
      onClick={onNavigate}
      className="group flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-border bg-card shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-(--radius-card) bg-muted">
        <SectionMerchBadge label={badgeLabel} color={badgeColor} />
        <div className="absolute left-2 top-2 z-10">
          <WishlistHeartButton product={product} />
        </div>
        {src && !broken ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            onError={() => setBroken(true)}
          />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <h3 className={PRODUCT_CARD_TITLE_CLASS} title={product.name}>
          {product.name}
        </h3>

        <div className="mt-1.5 h-5 shrink-0">
          <ProductCardReviewsAndEta
            size="default"
            ratingLabel={ratingLabel}
            reviewCount={product.reviewCount}
            instant={product.instant}
            reserveSpace
          />
        </div>

        <ProductCardPriceBlock
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />
      </div>
    </Link>
  );
}

function DefaultProductCardContent({ product }) {
  const [broken, setBroken] = useState(false);
  const src = product.imageUrl ?? product.images?.[0]?.url;
  const fromStore = useProductMerchBadge(product.id);
  const { badgeLabel, badgeColor } = resolveCardBadges({ fromStore });

  return (
    <Link
      to={productPath(product)}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--r-card)] border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        <SectionMerchBadge label={badgeLabel} color={badgeColor} />
        <div className="absolute left-2 top-2 z-10">
          <WishlistHeartButton product={product} />
        </div>
        {src && !broken ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
            onError={() => setBroken(true)}
          />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pt-2.5 pb-3 md:px-[18px] md:pt-4 md:pb-5">
        <h3 className="line-clamp-2 min-h-[2.5em] font-heading text-[13px] leading-tight font-bold tracking-tight md:min-h-[2.6em] md:text-[16.5px] md:leading-snug">
          {product.name}
        </h3>
        <div className="mt-1.5 flex min-h-[1.25rem] items-center gap-1.5 text-[11px] text-muted-foreground md:mt-2 md:min-h-0 md:text-[13px]">
          {product.rating != null ? (
            <span className="font-bold text-amber-800 dark:text-primary">
              ★ {product.rating}
            </span>
          ) : null}
          {product.tag ? (
            <span className="truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary md:px-2.5 md:py-1 md:text-[11px]">
              {product.tag}
            </span>
          ) : null}
        </div>
        <div className="mt-auto pt-2 text-sm font-extrabold md:text-lg">
          {formatPaise(product.pricePaise)}
        </div>
      </div>
    </Link>
  );
}

function ProductCardContent({ product, compact, onNavigate }) {
  if (compact) {
    return <CompactProductCardContent product={product} onNavigate={onNavigate} />;
  }
  return <DefaultProductCardContent product={product} />;
}

export function HomeProductCard({ product, variant = "default", onNavigate }) {
  const reduce = useReducedMotion();
  const compact = variant === "compact";

  if (compact) {
    return (
      <div className="min-w-0">
        <ProductCardContent product={product} compact onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <motion.div
      variants={reduce ? undefined : staggerItem}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
      className="min-w-0"
    >
      <ProductCardContent product={product} compact={false} />
    </motion.div>
  );
}

export function HomeProductCardCompact({ product, onNavigate }) {
  return <HomeProductCard product={product} variant="compact" onNavigate={onNavigate} />;
}

function RailProductCardContent({ product, badgeLabel, badgeColor }) {
  const [broken, setBroken] = useState(false);
  const src = product.imageUrl ?? product.images?.[0]?.url;
  const ratingLabel = formatRating(product.rating);
  const fromStore = useProductMerchBadge(product.id);
  const resolved = resolveCardBadges({
    badgeLabel,
    badgeColor,
    fromStore,
  });

  return (
    <Link
      to={productPath(product)}
      className="group flex h-full min-w-0 flex-col rounded-[var(--r-card)] border border-border/80 bg-card shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-border hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-(--radius-card) bg-muted">
        <SectionMerchBadge label={resolved.badgeLabel} color={resolved.badgeColor} />
        <div className="absolute left-2 top-2 z-10">
          <WishlistHeartButton product={product} />
        </div>
        {src && !broken ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            onError={() => setBroken(true)}
          />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="flex shrink-0 flex-col px-2 pb-2.5 pt-2 sm:px-2.5">
        <h3 className={PRODUCT_CARD_TITLE_CLASS} title={product.name}>
          {product.name}
        </h3>

        <div className="mt-1.5 h-5 shrink-0">
          <ProductCardReviewsAndEta
            size="rail"
            ratingLabel={ratingLabel}
            reviewCount={product.reviewCount}
            instant={product.instant}
            reserveSpace
          />
        </div>

        <ProductCardPriceBlock
          size="rail"
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />
      </div>
    </Link>
  );
}

export function HomeProductCardRail({ product, badgeLabel, badgeColor }) {
  return (
    <div className="h-full min-w-0">
      <RailProductCardContent
        product={product}
        badgeLabel={badgeLabel}
        badgeColor={badgeColor}
      />
    </div>
  );
}

export function HomeProductCardRailSkeleton() {
  return (
    <div className="h-full min-w-0 overflow-hidden rounded-[var(--r-card)] border border-border/80 bg-card shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col px-2 pb-2.5 pt-2 sm:px-2.5">
        <Skeleton className="min-h-[2.75em] w-[88%] rounded-md" />
        <div className="mt-1.5 flex h-5 items-center gap-1.5">
          <Skeleton className="h-5 w-10 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
        <div className="flex min-h-6 items-center justify-between pt-1.5">
          <Skeleton className="h-5 w-[4.5rem] rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function HomeProductCardSkeleton({ compact = false }) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden border border-border bg-card",
          compact ? "rounded-[var(--r-card)]" : "rounded-[var(--r-card)]",
        )}
      >
        <Skeleton className={cn("w-full rounded-none", compact ? "aspect-square" : "aspect-[4/3]")} />
        <div
          className={cn(
            "flex flex-1 flex-col",
            compact ? "px-2.5 pt-2.5 pb-3" : "px-2.5 pt-2.5 pb-3 md:px-[18px] md:pt-4 md:pb-5",
          )}
        >
          <Skeleton className="h-4 w-[88%] rounded-md" />
          <Skeleton className="mt-2 h-4 w-[62%] rounded-md" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-5 w-10 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <div className="mt-auto flex items-end justify-between pt-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

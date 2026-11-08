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
import { sectionBadgeAppearance } from "@/lib/section-badge-color";
import { ZapIcon } from "lucide-react";
import { WishlistHeartButton } from "@/module/catalog/components/WishlistHeartButton";
import {
  resolveCardBadges,
  useProductMerchBadge,
} from "@/module/home/hooks/use-product-merch-badge";

/**
 * Rail / compact card title. Phones (< md) match the user app card: medium weight,
 * fixed two-line height so every price row lines up. md+ keeps the desktop style.
 */
const CARD_TITLE_CLASS =
  "line-clamp-2 h-9 font-heading text-[13px] font-medium leading-[18px] text-foreground md:line-clamp-1 md:h-auto md:text-[15px] md:leading-snug";

/**
 * Card frame. Phones: no box (app style). md+: white card with an invisible border;
 * on hover the border and a soft shadow appear (no layout shift, border is always 1px).
 */
const CARD_FRAME_CLASS =
  "group flex h-full min-w-0 flex-col md:rounded-[var(--r-card)] md:border md:border-transparent md:bg-card md:transition-[box-shadow,border-color] md:duration-200 md:hover:border-border md:hover:shadow-[0_6px_20px_-4px_rgb(0_0_0/0.12)] md:focus-visible:border-border";

/** Photo: rounded on its own on phones; top corners only inside the md+ card. */
const CARD_PHOTO_CLASS =
  "size-full overflow-hidden rounded-xl bg-muted md:rounded-none md:rounded-t-(--radius-card)";

/** Card body padding: none on phones (app style), inset on md+. */
const CARD_BODY_CLASS = "flex flex-1 shrink-0 flex-col pt-2 md:px-3 md:pb-3 md:pt-3";

/* ---------- Card pieces (user app parity, used on every screen size) ---------- */

/** Ribbon badge hanging just past the photo's right edge, with a darker folded tail. */
function ProductCardRibbonBadge({ label, color, className }) {
  const text = label?.trim();
  if (!text) return null;
  const { className: colorClass, style } = sectionBadgeAppearance(color);

  return (
    <span className={cn("absolute top-2 -right-1 z-10 max-w-[85%]", className)}>
      <span
        className={cn(
          "flex h-[18px] items-center truncate pl-[9px] pr-[7px] text-[10px] font-semibold leading-none",
          colorClass,
          "text-white",
        )}
        style={{ ...style, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 5px 50%)" }}
      >
        {text}
      </span>
      {/* Folded tail tucked behind the card edge. */}
      <span
        aria-hidden
        className={cn("absolute top-full right-0 size-1 brightness-[0.62]", colorClass)}
        style={{ ...style, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
    </span>
  );
}

/** Green "13% OFF" tag: gradient fading right, slanted right edge (app DiscountTagSvg). */
function ProductCardDiscountTag({ percentOff }) {
  return (
    <span
      className="inline-flex h-[18px] shrink-0 items-center pr-[10px] pl-[4.5px] text-[10px] font-semibold leading-none text-success"
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--success) 24%, transparent), color-mix(in srgb, var(--success) 5%, transparent))",
        clipPath: "polygon(0 0, 100% 0, calc(100% - 5.5px) 100%, 0 100%)",
      }}
    >
      {percentOff}% OFF
    </span>
  );
}

/** MRP (struck) → selling price → discount tag, always on one line. */
function ProductCardPriceBlockMobile({ pricePaise, compareAtPaise }) {
  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const percentOff = discountPercent(pricePaise, compareAtPaise);

  return (
    <div className="mt-1 flex h-6 min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
      {hasCompare ? (
        <>
          <span className="sr-only">
            Sale price {formatPaise(pricePaise)}, was {formatPaise(compareAtPaise)}
          </span>
          <span
            aria-hidden
            className="min-w-0 truncate text-xs leading-4 text-muted-foreground line-through tabular-nums"
          >
            {formatPaise(compareAtPaise)}
          </span>
        </>
      ) : null}
      <span
        aria-hidden={hasCompare ? true : undefined}
        className="shrink-0 text-sm leading-[18px] font-semibold tabular-nums text-foreground"
      >
        {formatPaise(pricePaise)}
      </span>
      {percentOff > 0 ? (
        <span className="ml-0.5 shrink-0">
          <ProductCardDiscountTag percentOff={percentOff} />
        </span>
      ) : null}
    </div>
  );
}

/** Green ★ rating | review count, then the pink square "Instant" tag. */
function ProductCardMetaMobile({ ratingLabel, reviewCount, instant }) {
  const positiveCount = resolveReviewCount(reviewCount);
  const countLabel = positiveCount != null ? positiveCount.toLocaleString("en-IN") : null;
  const showInstant = Boolean(instant?.enabled);
  const instantLabel = (instant?.badgeLabel || "Instant").trim() || "Instant";

  return (
    <div className="flex h-5 items-center gap-2">
      {ratingLabel != null || countLabel != null ? (
        <div className="flex min-w-0 shrink items-center gap-1 overflow-hidden text-xs leading-none">
          {ratingLabel != null ? (
            <>
              <span className="font-bold text-success" aria-hidden>
                ★
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                <span className="sr-only">Rated </span>
                {ratingLabel}
              </span>
            </>
          ) : null}
          {ratingLabel != null && countLabel != null ? (
            <span className="mx-1 h-3 w-px shrink-0 bg-border" aria-hidden />
          ) : null}
          {countLabel != null ? (
            <span className="truncate text-muted-foreground tabular-nums">
              {countLabel}
              <span className="sr-only"> {positiveCount === 1 ? "review" : "reviews"}</span>
            </span>
          ) : null}
        </div>
      ) : null}
      {showInstant ? (
        <span className="inline-flex h-[18px] shrink-0 items-center gap-0.5 bg-instant px-1.5 text-[11px] font-semibold leading-none text-instant-foreground">
          <ZapIcon className="size-2.5 shrink-0 fill-current" strokeWidth={2.5} aria-hidden />
          {instantLabel}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Shared card photo + body for rail and compact cards.
 * Phones (< md) get the user app layout: title → price → rating/instant at the bottom.
 * md+ keeps the desktop layout: title → rating/instant → price.
 */
function ProductCardShell({ product, badgeLabel, badgeColor }) {
  const [broken, setBroken] = useState(false);
  const src = product.imageUrl ?? product.images?.[0]?.url;
  const ratingLabel = formatRating(product.rating);

  return (
    <>
      {/* Outer box does not clip, so the phone ribbon can hang past the photo edge. */}
      <div className="relative aspect-square w-full shrink-0">
        <div className={CARD_PHOTO_CLASS}>
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
        {/* Same ribbon on phone and desktop (user app parity). */}
        <ProductCardRibbonBadge label={badgeLabel} color={badgeColor} />
      </div>
      <div className={CARD_BODY_CLASS}>
        <h3 className={CARD_TITLE_CLASS} title={product.name}>
          {product.name}
        </h3>

        {/* Same order on every screen (user app parity): price + discount tag, then rating + Instant. */}
        <ProductCardPriceBlockMobile
          pricePaise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
        />
        <div className="mt-auto shrink-0 pt-0.5 md:pt-1.5">
          <ProductCardMetaMobile
            ratingLabel={ratingLabel}
            reviewCount={product.reviewCount}
            instant={product.instant}
          />
        </div>
      </div>
    </>
  );
}

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

function CompactProductCardContent({ product, onNavigate }) {
  const fromStore = useProductMerchBadge(product.id);
  const { badgeLabel, badgeColor } = resolveCardBadges({ fromStore });

  return (
    <Link to={productPath(product)} onClick={onNavigate} className={CARD_FRAME_CLASS}>
      <ProductCardShell
        product={product}
        badgeLabel={badgeLabel}
        badgeColor={badgeColor}
      />
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
  const fromStore = useProductMerchBadge(product.id);
  const resolved = resolveCardBadges({
    badgeLabel,
    badgeColor,
    fromStore,
  });

  return (
    <Link to={productPath(product)} className={CARD_FRAME_CLASS}>
      <ProductCardShell
        product={product}
        badgeLabel={resolved.badgeLabel}
        badgeColor={resolved.badgeColor}
      />
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
    <div className="h-full min-w-0 md:overflow-hidden md:rounded-[var(--r-card)] md:border md:border-border/80 md:bg-card md:shadow-sm">
      <Skeleton className="aspect-square w-full rounded-xl md:rounded-none" />
      <div className="flex flex-col pt-2 md:px-2.5 md:pb-2.5">
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

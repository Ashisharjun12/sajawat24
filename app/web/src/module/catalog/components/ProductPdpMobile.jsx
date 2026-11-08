/**
 * Phone-only (< md) PDP pieces that mirror the user app's product page
 * (app/user/module/catalog/components/product-detail/*). Desktop keeps its own layout.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  HeartIcon,
  MapPinIcon,
  ShoppingCartIcon,
  StarIcon,
  ZapIcon,
} from "lucide-react";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/product-price";
import { sectionBadgeAppearance } from "@/lib/section-badge-color";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { useProductMerchBadge } from "@/module/home/hooks/use-product-merch-badge";
import { useCartStore } from "@/store/cart.store";
import { useLocationStore } from "@/store/location.store";
import { useWishlistStore } from "@/store/wishlist.store";

/** Same green chips as the app PDP (Free delivery, Verified). */
const GREEN_CHIP_CLASS =
  "bg-[#dcfce7] text-[#15803d] dark:bg-emerald-950/50 dark:text-emerald-300";
/** Golden yellow Verified chip: pale gold fill, dark gold text, #F5B301 icon (matches the ★). */
const GOLD_CHIP_CLASS =
  "bg-[#fff4cc] text-[#a16207] dark:bg-amber-950/50 dark:text-amber-300";
const CHIP_CLASS =
  "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[3px] px-2 text-[10px] font-semibold tracking-wide uppercase";
const CHIP_ROTATE_MS = 2800;

const TOP_BAR_BUTTON =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted hover:bg-muted";

/* ---------- Top bar ---------- */

/** Solid header above the gallery: back · search · wishlist · cart (with count). */
export function PdpMobileTopBar({ product }) {
  const navigate = useNavigate();
  const count = useCartStore((s) => s.count);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const wishlisted = useWishlistStore((s) => (product?.id ? s.isWishlisted(product.id) : false));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  function goBack() {
    // Direct visits have no in-app history; send those home instead of leaving the site.
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between bg-background px-2 pb-1 md:hidden"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <button type="button" onClick={goBack} className={TOP_BAR_BUTTON} aria-label="Go back">
        <ArrowLeftIcon className="size-6" aria-hidden />
      </button>
      <div className="flex items-center gap-1">
        <SearchCommand variant="toolbarIcon" fullScreen className={cn(TOP_BAR_BUTTON, "size-10")} />
        {product?.id ? (
          <button
            type="button"
            onClick={() => void toggleWishlist(product)}
            className={TOP_BAR_BUTTON}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
          >
            <HeartIcon
              className={cn("size-6", wishlisted && "fill-instant text-instant")}
              aria-hidden
            />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={cn(TOP_BAR_BUTTON, "relative")}
          aria-label={count > 0 ? `Open bag, ${count} items` : "Open bag"}
        >
          <ShoppingCartIcon className="size-6" aria-hidden />
          {count > 0 ? (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white",
                count > 9 ? "min-w-5 px-1" : "size-5",
              )}
              aria-hidden
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

/* ---------- Price block ---------- */

/** Width of the scooter in the chip (px); height follows the 24×16 artwork. */
const SCOOTER_WIDTH = 18;
const SCOOTER_HEIGHT = (SCOOTER_WIDTH * 16) / 24;
/** Same timing as the app: parked 1.4s, ride out 0.52s, jump left, ride back in 0.52s. */
const PARKED_S = 1.4;
const RIDE_S = 0.52;

/**
 * Exact copy of the user app's `ScooterIcon` (components/ui/scooter-icon.tsx):
 * solid parcel box and body, thick handlebar + fork, chunky wheels with open hubs.
 * Uses `currentColor` so it takes the chip's text colour.
 */
function ScooterIcon() {
  const bar = {
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  };
  return (
    <svg
      width={SCOOTER_WIDTH}
      height={SCOOTER_HEIGHT}
      viewBox="0 0 24 16"
      className="block"
      aria-hidden
    >
      <rect x="1.5" y="3" width="6.5" height="5.5" rx="0.8" fill="currentColor" />
      <path
        d="M1.5 11.4 Q1.6 8.6 4.6 8.6 H8.6 L10 10.4 H14.6 L17.2 4.6 H18.8 L16.4 12 Q16 12.9 15 12.9 H8.6 Q8.2 10.6 5.5 10.6 Q3 10.6 2.6 12.2 Z"
        fill="currentColor"
      />
      <path d="M16.4 4.2 H19.8" {...bar} />
      <path d="M18.2 5 L20.1 11.6" {...bar} />
      <circle cx="5.5" cy="12.8" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20.1" cy="12.8" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * Same motion as the app's `AnimatedScooter`: parks, rides out of its box to the right,
 * re-enters from the left, loops; wheels bob slightly. Static under Reduce Motion.
 */
function AnimatedScooter() {
  const reduce = useReducedMotion();
  if (reduce) return <ScooterIcon />;

  // Travel a bit more than the icon width so it fully leaves the clipped box.
  const out = SCOOTER_WIDTH + 4;
  const total = PARKED_S + RIDE_S * 2;
  const leftAt = (PARKED_S + RIDE_S) / total;

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden"
      style={{ width: SCOOTER_WIDTH, height: SCOOTER_HEIGHT }}
    >
      <motion.span
        className="absolute inset-0"
        animate={{ x: [0, 0, out, -out, 0] }}
        transition={{
          duration: total,
          times: [0, PARKED_S / total, leftAt, leftAt + 0.0001, 1],
          ease: ["linear", "easeIn", "linear", "easeOut"],
          repeat: Infinity,
        }}
      >
        <motion.span
          className="block"
          animate={{ y: [0, -0.8, 0] }}
          transition={{ duration: 0.28, ease: "easeInOut", repeat: Infinity }}
        >
          <ScooterIcon />
        </motion.span>
      </motion.span>
    </span>
  );
}

/**
 * Rotating chip under the title. Faces, in order, each shown 2.8s:
 * FREE DELIVERY (+ scooter) → section badge (Trending, Popular…) → Instant (+ zap).
 * Faces that don't apply are skipped; with only one face it stays still.
 */
function PdpDeliveryChip({ productId, instant }) {
  const { badgeLabel, badgeColor } = useProductMerchBadge(productId);
  const sectionLabel = badgeLabel?.trim();
  const instantLabel = instant?.enabled
    ? (instant.badgeLabel || "Instant").trim() || "Instant"
    : null;
  const faces = ["delivery"];
  if (sectionLabel) faces.push("section");
  if (instantLabel) faces.push("instant");
  const faceCount = faces.length;

  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (faceCount < 2) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), CHIP_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [faceCount]);

  // Modulo here (not in state) so a change in face count never points past the list.
  const face = faces[tick % faceCount];
  const section = sectionLabel ? sectionBadgeAppearance(badgeColor) : null;
  const motionProps = reduce
    ? {}
    : {
        initial: { y: 10, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -10, opacity: 0 },
        transition: { duration: 0.24, ease: "easeOut" },
      };

  return (
    <span className="relative inline-flex h-[22px] overflow-hidden rounded-[3px]" aria-live="off">
      <AnimatePresence mode="wait" initial={false}>
        {face === "section" && section ? (
          <motion.span
            key="section"
            {...motionProps}
            className={cn(CHIP_CLASS, section.className, "text-white")}
            style={section.style}
          >
            {sectionLabel}
          </motion.span>
        ) : face === "instant" ? (
          <motion.span
            key="instant"
            {...motionProps}
            className={cn(CHIP_CLASS, "bg-instant text-instant-foreground")}
          >
            <ZapIcon className="size-3 fill-current" strokeWidth={2.5} aria-hidden />
            {instantLabel}
          </motion.span>
        ) : (
          <motion.span key="delivery" {...motionProps} className={cn(CHIP_CLASS, GREEN_CHIP_CLASS)}>
            Free delivery
            <AnimatedScooter />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

/**
 * Chip row above the price, used on phone AND desktop:
 * FREE DELIVERY (alternates with the Trending/Popular badge) · Verified · ★ rating pill.
 */
export function PdpPriceChipRow({ productId, instant, ratingAvg, reviewCount, className }) {
  const ratingLabel = formatRating(ratingAvg);
  const reviews =
    reviewCount != null && Number(reviewCount) > 0
      ? Number(reviewCount).toLocaleString("en-IN")
      : null;

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 shrink items-center">
        <PdpDeliveryChip productId={productId} instant={instant} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {ratingLabel != null ? (
          <span className={cn(CHIP_CLASS, GOLD_CHIP_CLASS)}>
            <BadgeCheckIcon className="size-3 text-[#f5b301]" aria-hidden />
            Verified
          </span>
        ) : null}
        {ratingLabel != null || reviews ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-sm">
            {ratingLabel != null ? (
              <>
                <StarIcon className="size-3.5 fill-[#f5b301] text-[#f5b301]" aria-hidden />
                <span className="font-medium tabular-nums text-foreground">
                  <span className="sr-only">Rated </span>
                  {ratingLabel}
                </span>
              </>
            ) : null}
            {ratingLabel != null && reviews ? (
              <span className="h-3.5 w-px bg-border" aria-hidden />
            ) : null}
            {reviews ? (
              <span className="tabular-nums text-muted-foreground">
                {reviews}
                <span className="sr-only"> reviews</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Free delivery chip · Verified + rating pill · price row · savings line. */
export function PdpMobilePriceBlock({
  productId,
  instant,
  pricePaise,
  compareAtPaise,
  ratingAvg,
  reviewCount,
}) {
  if (pricePaise == null) {
    return <p className="text-sm text-muted-foreground">Price unavailable</p>;
  }

  const hasCompare = compareAtPaise != null && compareAtPaise > pricePaise;
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  const savedPaise = hasCompare ? compareAtPaise - pricePaise : 0;

  return (
    <div className="flex flex-col gap-2.5 border-b border-border/60 pb-5">
      <PdpPriceChipRow
        productId={productId}
        instant={instant}
        ratingAvg={ratingAvg}
        reviewCount={reviewCount}
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-heading text-[22px] leading-[30px] font-semibold tabular-nums text-foreground">
          {formatPaise(pricePaise)}
        </span>
        {hasCompare ? (
          <span className="text-base text-muted-foreground line-through tabular-nums">
            {formatPaise(compareAtPaise)}
          </span>
        ) : null}
        {percentOff > 0 ? (
          <span className="text-sm font-semibold text-[#166534] dark:text-emerald-400">
            {percentOff}% OFF
          </span>
        ) : null}
      </div>

      {savedPaise > 0 ? (
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-success">You save {formatPaise(savedPaise)}</span>
          <span className="text-muted-foreground"> · Inclusive of all charges &amp; setup</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Inclusive of all charges &amp; setup</p>
      )}
    </div>
  );
}

/* ---------- Delivery preference ---------- */

function IndiaFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px]" aria-hidden>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#ff9933" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.6" />
      <circle cx="12" cy="8" r="0.45" fill="#000080" />
    </svg>
  );
}

function deliveryLocationLine(city, pincode) {
  const code = pincode?.code?.trim();
  const cityName = city?.name?.trim();
  if (code && cityName) return `${code}, ${cityName}`;
  if (code) return code;
  if (cityName) return cityName;
  return "Set delivery location";
}

function FulfillmentCard({ title, subtitle, Icon, selected, tone, onClick }) {
  const isInstant = tone === "instant";
  const activeText = isInstant ? "text-instant" : "text-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // 12px corners like the app. (Web `rounded-xl` = 24px sheet radius, too round.)
        "flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--r-btn)] border px-3 py-2.5 transition-colors",
        selected
          ? isInstant
            ? "border-instant bg-instant/10"
            : "border-primary bg-primary/10"
          : "border-border bg-card",
      )}
    >
      <span className="flex items-center gap-1.5">
        <Icon
          className={cn("size-4", selected ? activeText : "text-foreground", selected && isInstant && "fill-current")}
          aria-hidden
        />
        <span className={cn("font-heading text-[15px] font-semibold", selected ? activeText : "text-foreground")}>
          {title}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  );
}

/** "Choose delivery preference": location field + Schedule / Instant cards. */
export function PdpMobileDeliveryPreference({
  canInstant,
  canScheduled,
  isInstantBooking,
  onFulfillmentChange,
  onChangeLocation,
  instantLabel,
  instantEtaMinutes,
}) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const storeSetPickerOpen = useLocationStore((s) => s.setPickerOpen);
  const setPickerOpen = (open) =>
    onChangeLocation ? onChangeLocation() : storeSetPickerOpen(open);
  const line = deliveryLocationLine(city, pincode);
  const eta = instantEtaMinutes ?? 15;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Choose delivery preference
      </h2>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="size-4" aria-hidden />
          Delivery location
        </p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-12 items-center gap-3 rounded-[var(--r-btn)] border border-border bg-card px-3.5 text-left"
          aria-label={`Delivery location: ${line}. Change`}
        >
          <IndiaFlag />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{line}</span>
          <ChevronDownIcon className="size-5 shrink-0 text-foreground" aria-hidden />
        </button>
      </div>

      {canScheduled || canInstant ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDaysIcon className="size-4" aria-hidden />
            Choose delivery type
          </p>
          <div className="flex gap-3">
            {canScheduled ? (
              <FulfillmentCard
                title="Schedule"
                subtitle="Pick date & time"
                Icon={CalendarDaysIcon}
                tone="primary"
                selected={!isInstantBooking}
                onClick={() => onFulfillmentChange("scheduled")}
              />
            ) : null}
            {canInstant ? (
              <FulfillmentCard
                title={(instantLabel ?? "Instant").trim() || "Instant"}
                subtitle={`In ~${eta} min`}
                Icon={ZapIcon}
                tone="instant"
                selected={isInstantBooking}
                onClick={() => onFulfillmentChange("instant")}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Bottom booking bar ---------- */

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="#25D366" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.96 1.35-.5.05-.98.23-3.3-.69-2.79-1.1-4.56-3.95-4.7-4.13-.13-.18-1.12-1.49-1.12-2.85s.71-2.02.97-2.3a1.02 1.02 0 0 1 .74-.35l.53.01c.17.01.4-.06.62.48.24.57.8 1.96.87 2.1.07.14.12.31.02.49-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.92 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.46.21.53.33.07.12.07.68-.17 1.35Z" />
    </svg>
  );
}

/** Total · ✓ All inclusive · WhatsApp · "Book your setup" (orange) / "Book instant" (crimson). */
export function PdpMobileBookingBar({ pricePaise, booking, isInstantBooking, onWhatsApp, onBookNow }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="text-xs leading-[18px] text-muted-foreground">Total</p>
        <p className="font-heading text-base leading-6 font-semibold tabular-nums text-foreground">
          {pricePaise != null ? formatPaise(pricePaise) : "—"}
        </p>
        <p className="flex items-center gap-1 text-[11px] leading-4 font-medium text-success">
          <CheckIcon className="size-3" strokeWidth={2.5} aria-hidden />
          All inclusive
        </p>
      </div>
      <button
        type="button"
        onClick={onWhatsApp}
        className="flex size-12 shrink-0 items-center justify-center rounded-[var(--r-btn)] border border-border bg-card"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppGlyph />
      </button>
      <Button
        type="button"
        variant={isInstantBooking ? "instant" : "cta"}
        className="h-12 min-w-0 flex-1 rounded-[var(--r-btn)] px-5 font-heading text-[15px] font-semibold"
        disabled={booking}
        onClick={onBookNow}
      >
        {isInstantBooking ? <ZapIcon className="size-4 fill-current" aria-hidden /> : null}
        <span className="truncate">
          {booking ? "Adding…" : isInstantBooking ? "Book instant" : "Book your setup"}
        </span>
      </Button>
    </div>
  );
}

/* ---------- Schedule sheet ---------- */

/** Bottom sheet "Pick date & time slot" — opened by "Book your setup" (app parity). */
export function PdpScheduleSheet({ open, onOpenChange, title, imageUrl, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-[var(--r-sheet)] border-t p-0"
      >
        <SheetHeader className="shrink-0 px-5 pt-5 pb-3">
          <SheetTitle className="font-heading text-lg font-semibold">Pick date &amp; time slot</SheetTitle>
          <SheetDescription className="sr-only">
            Choose when we should arrive to set up, then continue to checkout.
          </SheetDescription>
        </SheetHeader>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          data-lenis-prevent
        >
          <div className="mb-4 flex items-center gap-3 rounded-[var(--r-card)] bg-[#d9f0ed] p-3 dark:bg-primary/15">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-14 shrink-0 rounded-[var(--r-btn)] object-cover" />
            ) : null}
            <p className="line-clamp-2 min-w-0 text-sm font-medium text-foreground">{title}</p>
          </div>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

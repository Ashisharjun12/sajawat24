import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import {
  CalendarCheck2Icon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  TimerIcon,
  ClockIcon,
  FlameIcon,
  ZapIcon,
  SparklesIcon,
} from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCatalogStore } from "@/store/catalog.store";
import { toast } from "@/components/ui/toast";
import { getApiError } from "@/api/api";
import { useCartStore } from "@/store/cart.store";
import { ProductPdpMobileHeader } from "@/module/catalog/components/ProductPdpMobileHeader";
import { ProductGalleryLightbox } from "@/module/catalog/components/ProductGalleryLightbox";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { MapsPinIcon } from "@/components/maps-pin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductPdpAboutPackage } from "@/module/catalog/components/ProductPdpAboutPackage";
import { ProductPdpAddonsSection } from "@/module/catalog/components/ProductPdpAddonsSection";
import { buildAddonSelections } from "@/module/catalog/lib/addon-selection";
import {
  ProductShareGalleryTrigger,
  ProductShareSheet,
  ProductShareTrigger,
} from "@/module/catalog/components/ProductShareSheet";
import { ProductPdpOffers } from "@/module/catalog/components/ProductPdpOffers";
import { ProductPdpDetailsTabs } from "@/module/catalog/components/ProductPdpDetailsTabs";
import { FulfillmentModeSwitch } from "@/module/catalog/components/FulfillmentModeTabs";
import { ProductReviewsPreview } from "@/module/catalog/components/reviews/ProductReviewsPreview";
import { proceedToCheckout } from "@/module/booking/lib/proceed-to-checkout";
import { useAuthStore } from "@/store/auth.store";
import { ProductOtherCategoriesRail } from "@/module/catalog/components/ProductOtherCategoriesRail";
import { ProductPdpSubcategoryRails } from "@/module/catalog/components/ProductPdpSubcategoryRails";
import {
  ProductPdpSimilarGalleryButton,
  ProductPdpSimilarPackages,
} from "@/module/catalog/components/ProductPdpSimilarPackages";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

function subscribeLgMedia(listener) {
  const mq = window.matchMedia(LG_MEDIA_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

function getLgMediaSnapshot() {
  return window.matchMedia(LG_MEDIA_QUERY).matches;
}

function useIsLgUp() {
  return useSyncExternalStore(subscribeLgMedia, getLgMediaSnapshot, () => true);
}

const PDP_REVIEWS_PREVIEW_CLASS = "";

const TIME_SLOTS = [
  { id: "9-12", label: "9 AM – 12 PM" },
  { id: "12-3", label: "12 PM – 3 PM" },
  { id: "3-6", label: "3 PM – 6 PM", fillingFast: true },
  { id: "6-9", label: "6 PM – 9 PM" },
  { id: "9-11", label: "9 PM – 11 PM" },
];

const SCROLL_X =
  "flex min-w-0 w-full gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function slotHour(slotId) {
  if (slotId === "9-12") return 9;
  if (slotId === "12-3") return 12;
  if (slotId === "3-6") return 15;
  if (slotId === "6-9") return 18;
  return 21;
}

function slotLabelFor(slotId) {
  return TIME_SLOTS.find((item) => item.id === slotId)?.label ?? "";
}

function imageSrc(item) {
  return item?.url || item?.publicUrl || item?.optimizedUrl || item?.thumbnailUrl || "";
}

function thumbSrc(item) {
  return item?.thumbnailUrl || item?.url || item?.publicUrl || item?.optimizedUrl || "";
}

function galleryImages(images) {
  return (images ?? []).filter((item) => item.kind !== "video");
}

function indexCategories(categories) {
  const byId = new Map();
  function walk(nodes) {
    for (const node of nodes ?? []) {
      byId.set(node.id, node);
      walk(node.children);
    }
  }
  walk(categories);
  return byId;
}

function resolveProductCategory(categoryId, categories) {
  if (!categoryId) return { label: "Decorations", href: "/decorations" };
  const byId = indexCategories(categories);
  const cat = byId.get(categoryId);
  if (!cat) return { label: "Decorations", href: "/decorations" };
  if (cat.parentId) {
    const parent = byId.get(cat.parentId);
    if (parent) {
      return { label: cat.name, href: categoryPath(parent, cat), parent };
    }
  }
  return { label: cat.name, href: categoryPath(cat) };
}

function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function openBrandWhatsApp(brand) {
  if (brand?.whatsappUrl) {
    window.open(brand.whatsappUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (brand?.contactPhone) {
    window.open(`tel:${brand.contactPhone}`, "_self");
    return;
  }
  toast.add({
    title: "WhatsApp is not available right now.",
    type: "error",
  });
}

function ProductPdpBookingActions({
  booking,
  isInstantBooking,
  onWhatsApp,
  onBookNow,
  className,
}) {
  return (
    <div className={cn("flex min-w-0 gap-2.5 sm:gap-3", className)}>
      <Button
        type="button"
        size="lg"
        className="h-12 min-w-0 flex-1 gap-2 rounded-xl bg-[#00A859] text-base font-semibold text-white shadow-sm hover:bg-[#009650] hover:text-white sm:min-w-40 [&_svg]:size-5"
        onClick={onWhatsApp}
      >
        <WhatsAppIcon />
        WhatsApp
      </Button>
      <Button
        type="button"
        size="lg"
        variant={isInstantBooking ? "ghost" : "default"}
        className={cn(
          "h-12 min-w-0 flex-1 rounded-xl text-base font-bold sm:min-w-40",
          isInstantBooking
            ? "gap-2 border-0 bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600 hover:text-white"
            : "bg-primary text-black shadow-sm hover:bg-primary/90",
        )}
        disabled={booking}
        onClick={onBookNow}
      >
        {isInstantBooking ? <ZapIcon className="size-5 fill-current" aria-hidden /> : null}
        {booking ? "Adding…" : isInstantBooking ? "Book instant" : "Book Now"}
        {!booking && !isInstantBooking ? (
          <ChevronRightIcon className="size-5 shrink-0" aria-hidden />
        ) : null}
      </Button>
    </div>
  );
}

function ProductPdpMobileBookingBar({
  pricePaise,
  booking,
  isInstantBooking,
  onWhatsApp,
  onBookNow,
}) {
  return (
    <div className="flex items-end gap-2.5">
      <div className="min-w-0 flex-1 pb-0.5">
        <p className="text-[11px] leading-tight text-muted-foreground">All-inclusive price</p>
        <p className="text-[1.35rem] font-extrabold leading-tight tracking-tight text-foreground tabular-nums">
          {pricePaise != null ? formatPaise(pricePaise) : "—"}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium leading-tight text-emerald-600 dark:text-emerald-500">
          <CheckIcon className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
          Setup, delivery &amp; materials included
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-[3.25rem] shrink-0 rounded-xl bg-emerald-50 text-[#00A859] hover:bg-emerald-100 hover:text-[#009650] [&_svg]:size-6 dark:bg-emerald-950/40 dark:text-emerald-400"
          onClick={onWhatsApp}
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon />
        </Button>

        <Button
          type="button"
          size="lg"
          className={cn(
            "h-[3.25rem] min-w-[9.5rem] max-w-[11.5rem] gap-1 rounded-xl px-3.5 text-sm font-bold shadow-sm",
            isInstantBooking
              ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
              : "bg-primary text-black hover:bg-primary/90",
          )}
          disabled={booking}
          onClick={onBookNow}
        >
          {isInstantBooking ? <ZapIcon className="size-4 fill-current" aria-hidden /> : null}
          <span className="truncate">
            {booking ? "Adding…" : isInstantBooking ? "Book instant" : "Book your setup"}
          </span>
          {!booking ? <ChevronRightIcon className="size-4 shrink-0" aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}

const INSTANT_ETA_FALLBACK_MINUTES = 15;

function InstantDetailRow({ icon, iconClassName, children, textClassName }) {
  return (
    <div className="flex w-full items-start gap-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p
        className={cn(
          "min-w-0 flex-1 pt-2 text-sm leading-relaxed",
          textClassName,
        )}
      >
        {children}
      </p>
    </div>
  );
}

function InstantBookingDetails({ note, etaMinutes }) {
  const description = (note ?? "").trim();
  const eta = etaMinutes ?? INSTANT_ETA_FALLBACK_MINUTES;

  return (
    <div className="flex w-full flex-col gap-3">
      {description ? (
        <InstantDetailRow
          icon={<SparklesIcon className="size-4" />}
          iconClassName="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400"
          textClassName="font-normal text-foreground/85"
        >
          {description}
        </InstantDetailRow>
      ) : null}
      <InstantDetailRow
        icon={<ClockIcon className="size-4" />}
        iconClassName="bg-blue-600/15 text-blue-600 dark:text-blue-400"
        textClassName="font-normal text-foreground/75"
      >
        Typical arrival window: about {eta} minutes after confirmation.
      </InstantDetailRow>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ProductPrice({ pricePaise, compareAtPaise, ratingAvg, reviewCount }) {
  if (pricePaise == null) {
    return <p className="text-muted-foreground">Price unavailable</p>;
  }

  const savedPaise =
    compareAtPaise != null && compareAtPaise > pricePaise ? compareAtPaise - pricePaise : 0;
  const percentOff =
    compareAtPaise != null && compareAtPaise > pricePaise
      ? Math.round((1 - pricePaise / compareAtPaise) * 100)
      : 0;
  const ratingLabel = formatRating(ratingAvg);
  const reviews =
    reviewCount != null && Number(reviewCount) > 0
      ? Number(reviewCount).toLocaleString()
      : null;

  return (
    <div className="flex flex-col gap-2.5 border-b border-border/60 pb-5">
      {ratingLabel != null || reviews ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {ratingLabel != null ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              <span aria-hidden>★</span>
              {ratingLabel}
            </span>
          ) : null}
          {reviews ? (
            <span className="text-muted-foreground">{reviews} reviews</span>
          ) : null}
          {ratingLabel != null ? (
            <>
              <span className="text-muted-foreground/50" aria-hidden>·</span>
              <span className="text-muted-foreground">Verified</span>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
          {formatPaise(pricePaise)}
        </span>
        {compareAtPaise != null && compareAtPaise > pricePaise ? (
          <span className="text-base text-muted-foreground line-through tabular-nums">
            {formatPaise(compareAtPaise)}
          </span>
        ) : null}
        {percentOff > 0 ? (
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {percentOff}% OFF
          </span>
        ) : null}
      </div>
      {savedPaise > 0 ? (
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            You save {formatPaise(savedPaise)}
          </span>
          <span className="text-muted-foreground"> · Inclusive of all charges &amp; setup</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Inclusive of all charges &amp; setup</p>
      )}
    </div>
  );
}

function ProductOnSiteSetupBadge({ label = "On-site setup in 1-1.5 hrs" }) {
  return (
    <span
      className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-black"
    >
      <TimerIcon className="size-4 shrink-0 text-black" aria-hidden />
      {label}
    </span>
  );
}

function ProductLocationCard({ cityLabel, onChangeLocation }) {
  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-600/20 bg-emerald-50/90 px-3 py-3 sm:px-4 dark:border-emerald-500/25 dark:bg-emerald-950/35"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-600/10 bg-white shadow-sm dark:bg-background"
        aria-hidden
      >
        <MapsPinIcon size={24} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-base font-bold text-foreground">{cityLabel}</span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase"
          >
            <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
            Available
          </span>
        </div>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:text-sm">
          We set up within 30 km across the city
        </p>
      </div>
      <button
        type="button"
        onClick={onChangeLocation}
        className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        Change
        <ChevronRightIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function ProductBreadcrumb({ title, categoryId }) {
  const categories = useCatalogStore((s) => s.categories);
  const category = useMemo(
    () => resolveProductCategory(categoryId, categories),
    [categoryId, categories],
  );

  return (
    <nav
      className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link to="/" className="shrink-0 hover:text-foreground">
        Home
      </Link>
      <span className="shrink-0 text-muted-foreground/60" aria-hidden>/</span>
      <Link to={category.href} className="max-w-[42%] truncate hover:text-foreground">
        {category.label}
      </Link>
      <span className="shrink-0 text-muted-foreground/60" aria-hidden>/</span>
      <span className="min-w-0 truncate font-medium text-foreground" title={title}>
        {title}
      </span>
    </nav>
  );
}

function ProductGallery({ images, title, onShare, onSimilar, showSimilar }) {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selected = images[selectedIndex] ?? images[0] ?? null;
  const src = imageSrc(selected);

  useEffect(() => {
    setSelectedIndex((index) => {
      if (!images.length) return 0;
      return Math.min(index, images.length - 1);
    });
  }, [images]);

  function step(delta) {
    if (images.length < 2) return;
    setSelectedIndex((index) => (index + delta + images.length) % images.length);
  }

  const thumbButtons =
    images.length > 1
      ? images.map((item, index) => {
          const thumb = thumbSrc(item);
          return (
            <button
              key={item.uploadId || item.url || index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === selectedIndex}
              className={cn(
                "size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-muted ring-2 ring-transparent transition-shadow",
                index === selectedIndex && "ring-primary shadow-sm",
              )}
            >
              {thumb ? (
                <img src={thumb} alt="" className="size-full object-contain object-center bg-muted/80" />
              ) : (
                <DecoryImageFallback />
              )}
            </button>
          );
        })
      : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-start md:gap-3">
      {thumbButtons ? (
        <div className="hidden shrink-0 flex-col gap-2.5 md:flex">{thumbButtons}</div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div
        className={cn(
          "relative w-full min-w-0 overflow-hidden bg-muted",
          "max-md:rounded-none max-md:shadow-none max-md:ring-0",
          "md:rounded-2xl md:border md:border-border/80 md:shadow-sm md:ring-1 md:ring-border/60",
        )}
      >
        {src ? (
          <button
            type="button"
            className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open full screen gallery"
          >
            <img
              src={src}
              alt={title}
              className="block h-auto w-full max-w-full object-contain object-center max-md:rounded-none md:rounded-2xl"
              decoding="async"
              fetchPriority="high"
            />
          </button>
        ) : (
          <DecoryImageFallback className="min-h-[200px] w-full" />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/5 dark:bg-background/95"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="size-5" aria-hidden />
          </button>
          <div className="pointer-events-auto flex items-center gap-2">
            {onShare ? <ProductShareGalleryTrigger onClick={onShare} /> : null}
            <Link
              to="/"
              className="flex size-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/5 dark:bg-background/95"
              aria-label="Home"
            >
              <HomeIcon className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute top-1/2 left-2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/10 hover:bg-white md:left-3 dark:bg-background/95"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/10 hover:bg-white md:right-3 dark:bg-background/95"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
            >
              <ChevronRightIcon className="size-5" aria-hidden />
            </button>
          </>
        ) : null}
        {showSimilar && onSimilar ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-end px-3 md:bottom-4 md:px-4">
            <ProductPdpSimilarGalleryButton onClick={onSimilar} />
          </div>
        ) : null}
      </div>
      <ProductGalleryLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        title={title}
        initialIndex={selectedIndex}
      />
      </div>
    </div>
  );
}

function ProductSchedule({ onChange }) {
  const today = useMemo(() => startOfToday(), []);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slot, setSlot] = useState("9-12");
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const dateSelected = selectedDate != null;
  const inStrip = dateSelected && dates.some((date) => isSameDay(date, selectedDate));

  function commitSchedule() {
    if (!selectedDate) return;
    const scheduled = new Date(selectedDate);
    scheduled.setHours(slotHour(slot), 0, 0, 0);
    onChange?.(scheduled.toISOString());
    setConfirmed(true);
  }

  function reopenSchedule() {
    setConfirmed(false);
    onChange?.(null);
  }

  const slotLabel = slotLabelFor(slot);
  const dateSummary = dateSelected ? format(selectedDate, "EEEE, d MMMM yyyy") : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck2Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle>Choose Date &amp; Time</CardTitle>
            <CardDescription>When should we arrive to set up?</CardDescription>
          </div>
        </div>
        {confirmed ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600/15">
              <CheckIcon className="size-3" strokeWidth={3} />
            </span>
            Set
          </span>
        ) : null}
      </CardHeader>
      {confirmed ? (
        <CardContent>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-emerald-600/10 px-3 py-3 sm:px-4">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
              aria-hidden
            >
              <CheckIcon className="size-4" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 sm:text-base">
                {slotLabel} · {dateSummary}
              </p>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 sm:text-sm">
                We&apos;ll arrive &amp; complete the full setup within this slot.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 font-semibold text-foreground hover:bg-transparent hover:text-foreground"
              onClick={reopenSchedule}
            >
              Change
            </Button>
          </div>
        </CardContent>
      ) : (
      <CardContent className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Select date
          </p>
          <div className={SCROLL_X}>
            {dates.map((date) => {
              const selected = dateSelected && isSameDay(date, selectedDate);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex min-w-14 shrink-0 flex-col items-center rounded-2xl border px-2 py-2 text-xs",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span className="uppercase">{format(date, "EEE")}</span>
                  <span className="font-heading text-base font-medium">{format(date, "d")}</span>
                  <span>{format(date, "MMM")}</span>
                </button>
              );
            })}
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger
                type="button"
                className={cn(
                  "inline-flex h-auto min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-2 text-xs font-medium transition-colors",
                  dateSelected && !inStrip
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <CalendarDaysIcon className="size-4" />
                {inStrip || !dateSelected ? "More dates" : format(selectedDate, "d MMM")}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate ?? undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setMoreOpen(false);
                  }}
                  disabled={{ before: today }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {dateSelected ? (
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Select time
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon className="size-3.5" />
                3-hr window
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((item) => {
                const selected = slot === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSlot(item.id)}
                    className={cn(
                      "flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-black/10 bg-background px-1 py-2 text-center shadow-none transition-colors dark:border-white/15",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] leading-none font-semibold whitespace-nowrap sm:text-xs",
                        selected ? "text-primary-foreground" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.fillingFast ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wide uppercase",
                          selected
                            ? "bg-white/20 text-primary-foreground"
                            : "bg-rose-600 text-white",
                        )}
                      >
                        <FlameIcon className="size-2.5" />
                        Filling fast
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckIcon className="size-2.5" strokeWidth={3} />
              </span>
              <span>
                Our team <span className="font-medium text-foreground">arrives &amp; completes the setup</span>{" "}
                within your selected time slot.
              </span>
            </p>
          </div>
        ) : null}
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!dateSelected}
          onClick={commitSchedule}
        >
          Done
        </Button>
      </CardContent>
      )}
    </Card>
  );
}

export function ProductPdp({ product, onChangeLocation }) {
  const images = useMemo(() => galleryImages(product?.images), [product?.images]);
  const title = (product?.name ?? "").trim() || "Product";
  const copy = (product?.description ?? "").trim();
  const cityLabel = (product?.city?.name ?? "").trim() || "Select city";
  const [scheduledAt, setScheduledAt] = useState(null);
  const canInstant = Boolean(product?.instant?.enabled);
  const canScheduled = product?.scheduledEnabled !== false;
  const [fulfillment, setFulfillment] = useState(
    canInstant && !canScheduled ? "instant" : "scheduled",
  );
  const isInstantBooking = fulfillment === "instant" && canInstant;
  const [booking, setBooking] = useState(false);
  const [addonQtyById, setAddonQtyById] = useState({});
  const [shareOpen, setShareOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);

  const productAddons = product?.addons ?? [];
  const hasAddons = productAddons.length > 0;
  const isLgUp = useIsLgUp();
  const { brand } = useSiteShell();

  const onWhatsApp = useCallback(() => openBrandWhatsApp(brand), [brand]);

  const reviewsPreview = (
    <ProductReviewsPreview
      productId={product?.id}
      product={product}
      previewLimit={3}
      className={PDP_REVIEWS_PREVIEW_CLASS}
    />
  );

  function setAddonQty(addonId, next) {
    setAddonQtyById((prev) => {
      if (next <= 0) {
        const { [addonId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: next };
    });
  }

  async function completeBooking() {
    if (!product?.id) return;
    setBooking(true);
    try {
      const selections = buildAddonSelections(productAddons, addonQtyById);
      const addons = selections.length ? selections : undefined;
      await addItem(
        {
          productId: product.id,
          addons,
          quantity: 1,
          pincode: pincode?.code || undefined,
          cityId: pincode?.code ? undefined : city?.id,
          scheduledAt: isInstantBooking ? null : scheduledAt || undefined,
          fulfillmentType: isInstantBooking ? "instant" : "scheduled",
        },
        { openDrawer: false },
      );
      toast.add({ title: "Added to bag", type: "success" });
      proceedToCheckout({
        user,
        setLoginOpen,
        navigate,
        setCartOpen,
      });
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    } finally {
      setBooking(false);
    }
  }

  function onBookNow() {
    if (!product?.id) return;
    const hasLocation =
      Boolean(pincode?.code) || (Boolean(city?.id) && isBackendCityId(city.id));
    if (!hasLocation) {
      setPickerOpen(true);
      toast.add({ title: "Select your city first", type: "info" });
      return;
    }
    if (!isInstantBooking && !scheduledAt) {
      toast.add({ title: "Choose date and time, then tap Done", type: "info" });
      return;
    }
    void completeBooking();
  }

  return (
    <div className="flex min-w-0 flex-col gap-0 max-md:pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      <ProductPdpMobileHeader />
      <div className="grid min-w-0 gap-8 overflow-x-hidden lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:z-[1] lg:self-start">
          <ProductGallery
            images={images}
            title={title}
            onShare={() => setShareOpen(true)}
            showSimilar={Boolean(product?.categoryId)}
            onSimilar={() => setSimilarOpen(true)}
          />
          {isLgUp ? reviewsPreview : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4 px-4 pb-2 md:px-0">
        <ProductBreadcrumb title={title} categoryId={product?.categoryId} />

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h1
              className="line-clamp-2 min-w-0 flex-1 font-heading text-2xl font-semibold tracking-tight md:text-[1.75rem] md:leading-snug"
              title={title}
            >
              {title}
            </h1>
            <ProductShareTrigger
              className="hidden md:inline-flex"
              onClick={() => setShareOpen(true)}
            />
          </div>
        </div>

        <ProductPrice
          pricePaise={product?.pricePaise}
          compareAtPaise={product?.compareAtPaise}
          ratingAvg={product?.ratingAvg}
          reviewCount={product?.reviewCount}
        />

        <div className="flex flex-col gap-3">
          <ProductOnSiteSetupBadge />
          <div className="hidden md:block">
            <ProductLocationCard cityLabel={cityLabel} onChangeLocation={onChangeLocation} />
          </div>
        </div>

        {canInstant && canScheduled ? (
          <FulfillmentModeSwitch
            value={fulfillment}
            onChange={setFulfillment}
            instantLabel={product.instant?.badgeLabel}
          />
        ) : null}

        {isInstantBooking ? (
          <InstantBookingDetails
            note={product.instant?.pdpNote}
            etaMinutes={product.instant?.etaMinutes}
          />
        ) : canScheduled ? (
          <ProductSchedule onChange={setScheduledAt} />
        ) : null}

        <ProductPdpBookingActions
          className="hidden md:flex"
          booking={booking}
          isInstantBooking={isInstantBooking}
          onWhatsApp={onWhatsApp}
          onBookNow={onBookNow}
        />

        <ProductPdpOffers productId={product?.id} categoryId={product?.categoryId} />

        {hasAddons ? (
          <ProductPdpAddonsSection
            addons={productAddons}
            qtyById={addonQtyById}
            onSetQty={setAddonQty}
            disabled={booking}
          />
        ) : null}

        <ProductPdpAboutPackage description={copy} />

        <ProductPdpDetailsTabs
          includes={product?.includes}
          faqs={product?.faqs}
          deliverySetup={product?.deliverySetup}
          careInstructions={product?.careInstructions}
        />

        {!isLgUp ? reviewsPreview : null}

        </div>
      </div>

      <div className="px-4 md:px-0">
        <ProductPdpSubcategoryRails product={product} />
        <ProductOtherCategoriesRail product={product} />
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pt-2.5 shadow-[0_-4px_24px_-8px] shadow-foreground/10 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <ProductPdpMobileBookingBar
          pricePaise={product?.pricePaise}
          booking={booking}
          isInstantBooking={isInstantBooking}
          onWhatsApp={onWhatsApp}
          onBookNow={onBookNow}
        />
      </div>

      <ProductShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={title}
        productId={product?.id}
      />
      <ProductPdpSimilarPackages
        product={product}
        open={similarOpen}
        onOpenChange={setSimilarOpen}
      />
    </div>
  );
}

export function ProductPdpSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-0" aria-busy="true" aria-live="polite">
      <ProductPdpMobileHeader />
      <div
        className="grid min-w-0 gap-8 overflow-x-hidden lg:grid-cols-2 lg:items-start lg:gap-10"
      >
      <span className="sr-only">Loading product</span>
      <div className="min-w-0 lg:sticky lg:top-20">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
          <div className="hidden shrink-0 flex-col gap-2.5 md:flex">
            <Skeleton className="size-[4.5rem] rounded-2xl" />
            <Skeleton className="size-[4.5rem] rounded-2xl" />
            <Skeleton className="size-[4.5rem] rounded-2xl" />
          </div>
          <Skeleton className="aspect-[4/3] min-h-[200px] w-full flex-1 rounded-none md:rounded-2xl" />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 px-4 md:px-0">
        <Skeleton className="h-4 w-[72%] rounded-md" />
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-8 w-[85%] rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[72%] rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-14 w-full rounded-4xl" />
        <div className="flex min-w-0 flex-col gap-3">
          <Skeleton className="h-5 w-44 rounded-md" />
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-[70%] rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-4xl border bg-card p-4">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="mt-2 h-3 w-52 rounded-md" />
          <div className="mt-4 flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-14 shrink-0 rounded-2xl" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 flex-1 rounded-full" />
        </div>
        <div className="space-y-2 rounded-4xl border bg-card p-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
      </div>
    </div>
  );
}

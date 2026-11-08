import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, TicketPercentIcon } from "lucide-react";
import { buildCouponPreviewFromApplied } from "@/module/booking/lib/coupon-preview";
import { CouponDetailSheet } from "@/module/promotions/components/CouponDetailSheet";
import { useAvailableCoupons } from "@/module/promotions/lib/use-available-coupons";

/** Rail shows up to 8 coupons (app parity). */
const PDP_OFFER_RAIL_LIMIT = 8;

function offersPageHref(productId, categoryId) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (categoryId) params.set("categoryId", categoryId);
  const q = params.toString();
  return q ? `/offers?${q}` : "/offers";
}

/** 9-bump scalloped seal points (outer/inner radius alternate), as an SVG path. */
function sealPath(size, bumps = 9) {
  const c = size / 2;
  const outer = c;
  const inner = c * 0.86;
  const steps = bumps * 2;
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = (c + r * Math.cos(angle)).toFixed(2);
    const y = (c + r * Math.sin(angle)).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  return `${d} Z`;
}

/** Pale mint scalloped "%" seal, pushed into the card's top-right corner (clipped). */
function DiscountSeal() {
  const size = 46;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute -top-[7px] -right-[7px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="pdp-discount-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6f5df" />
          <stop offset="1" stopColor="#a9e4bc" />
        </linearGradient>
      </defs>
      <path d={sealPath(size)} fill="url(#pdp-discount-seal)" strokeLinejoin="round" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Poppins, sans-serif"
        fontWeight="600"
        fontSize="21"
      >
        %
      </text>
    </svg>
  );
}

/** Minimal ticket card: navy code, "discount · title", seal in the corner. */
function CouponTicketCardMinimal({ coupon, onOpen }) {
  const preview = buildCouponPreviewFromApplied(coupon);
  if (!preview?.code) return null;
  const detail = coupon.name || preview.subtitle;

  return (
    <button
      type="button"
      onClick={() => onOpen(coupon)}
      className="relative min-h-[96px] w-60 shrink-0 snap-start overflow-hidden rounded-[var(--r-btn)] border border-border/80 bg-card px-3.5 pt-3.5 pb-3 text-left"
      aria-label={`Coupon ${preview.code}: ${preview.discount}. View details`}
    >
      <p className="truncate pr-12 font-heading text-[19px] leading-tight font-bold tracking-wide text-[#13306b] uppercase dark:text-sky-200">
        {preview.code}
      </p>
      <p className="mt-2 line-clamp-2 text-[13px] leading-[19px] text-foreground/85">
        {detail ? `${preview.discount} · ${detail}` : preview.discount}
      </p>
      <DiscountSeal />
    </button>
  );
}

/**
 * "Available offers" header + horizontal coupon rail, on every screen size (app parity).
 * md+: prev/next arrow buttons over the rail and a scroll progress bar under it.
 */
function ProductPdpOffersRail({ coupons, viewAllHref }) {
  const [selected, setSelected] = useState(null);
  const railRef = useRef(null);
  const [scroll, setScroll] = useState({ progress: 0, thumb: 1, atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      progress: max > 0 ? el.scrollLeft / max : 0,
      thumb: el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft >= max - 2,
    });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, coupons.length]);

  function step(direction) {
    const el = railRef.current;
    if (!el) return;
    // One card (240px) + gap (12px) per click.
    el.scrollBy({ left: direction * 252, behavior: "smooth" });
  }

  const scrollable = scroll.thumb < 1;
  const arrowClass =
    "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-opacity hover:bg-muted md:flex";

  return (
    <section className="flex flex-col gap-3" aria-labelledby="pdp-offers-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
            aria-hidden
          >
            <TicketPercentIcon className="size-4" />
          </span>
          <h2 id="pdp-offers-title" className="font-heading text-base font-semibold text-foreground">
            Available offers
          </h2>
        </div>
        <Link
          to={viewAllHref}
          className="shrink-0 text-sm font-semibold text-[#15803d] dark:text-emerald-400"
        >
          View all
        </Link>
      </div>
      <div className="relative">
        <div
          ref={railRef}
          onScroll={measure}
          className="flex snap-x gap-3 overflow-x-auto overscroll-x-contain pb-1 max-md:-mx-5 max-md:px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {coupons.slice(0, PDP_OFFER_RAIL_LIMIT).map((coupon) => (
            <CouponTicketCardMinimal key={coupon.code} coupon={coupon} onOpen={setSelected} />
          ))}
        </div>
        {scrollable && !scroll.atStart ? (
          <button
            type="button"
            onClick={() => step(-1)}
            className={`${arrowClass} -left-3`}
            aria-label="Previous offers"
          >
            <ChevronLeftIcon className="size-5" aria-hidden />
          </button>
        ) : null}
        {scrollable && !scroll.atEnd ? (
          <button
            type="button"
            onClick={() => step(1)}
            className={`${arrowClass} -right-3`}
            aria-label="More offers"
          >
            <ChevronRightIcon className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>
      {/* md+: scroll progress bar (thumb width = visible share of the rail). */}
      {scrollable ? (
        <div className="mx-auto hidden h-1 w-60 overflow-hidden rounded-full bg-border md:block" aria-hidden>
          <div
            className="h-full rounded-full bg-primary transition-[margin] duration-150"
            style={{
              width: `${scroll.thumb * 100}%`,
              marginLeft: `${scroll.progress * (1 - scroll.thumb) * 100}%`,
            }}
          />
        </div>
      ) : null}
      <CouponDetailSheet
        coupon={selected}
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </section>
  );
}

export function ProductPdpOffers({ productId, categoryId }) {
  const { coupons, loading } = useAvailableCoupons({
    productId,
    categoryId,
    scope: "product",
  });

  if (loading || coupons.length === 0) return null;

  return (
    <ProductPdpOffersRail coupons={coupons} viewAllHref={offersPageHref(productId, categoryId)} />
  );
}

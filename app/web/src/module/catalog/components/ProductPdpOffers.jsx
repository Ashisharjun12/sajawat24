import { useState } from "react";
import { Link } from "react-router-dom";
import { TicketPercentIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ProductPdpSectionTrigger } from "@/module/catalog/components/ProductPdpSectionTrigger";
import { buildCouponPreviewFromApplied } from "@/module/booking/lib/coupon-preview";
import { CouponDetailSheet } from "@/module/promotions/components/CouponDetailSheet";
import { CouponOffersList } from "@/module/promotions/components/CouponOffersList";
import { useAvailableCoupons } from "@/module/promotions/lib/use-available-coupons";

const PDP_OFFER_PREVIEW_LIMIT = 4;
/** Phone rail shows up to 8 coupons (app parity). */
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

/** Phones: "Available offers" header + horizontal coupon rail (app parity). */
function ProductPdpOffersRail({ coupons, viewAllHref }) {
  const [selected, setSelected] = useState(null);

  return (
    <section className="flex flex-col gap-3 md:hidden" aria-labelledby="pdp-offers-title">
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
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {coupons.slice(0, PDP_OFFER_RAIL_LIMIT).map((coupon) => (
          <CouponTicketCardMinimal key={coupon.code} coupon={coupon} onOpen={setSelected} />
        ))}
      </div>
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

  const hasMore = coupons.length > PDP_OFFER_PREVIEW_LIMIT;
  const viewMoreHref = offersPageHref(productId, categoryId);

  return (
    <>
      <ProductPdpOffersRail coupons={coupons} viewAllHref={viewMoreHref} />

      {/* md+: collapsible list */}
      <Accordion type="single" collapsible className="rounded-4xl border bg-card max-md:hidden">
        <AccordionItem value="offers" className="border-none data-open:bg-transparent">
          <ProductPdpSectionTrigger
            icon={<TicketPercentIcon className="size-4" />}
            iconClassName="bg-primary/15 text-foreground"
            title="Available offers"
            subtitle={`${coupons.length} coupon${coupons.length === 1 ? "" : "s"} for this setup`}
          />
          <AccordionContent>
            <CouponOffersList
              coupons={coupons}
              limit={PDP_OFFER_PREVIEW_LIMIT}
              className="flex flex-col"
            />
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-full"
                nativeButton={false}
                render={<Link to={viewMoreHref} />}
              >
                View more offers
              </Button>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}

import { ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { discountPercent } from "@/lib/product-price";
import { formatInstantCardEta } from "@/module/catalog/lib/instant-card-copy";

/** Commercial anchor — top-left on card image (Baymard-style deal visibility). */
export function ProductCardDiscountBadge({ pricePaise, compareAtPaise, className }) {
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  if (percentOff <= 0) return null;
  return (
    <span
      className={cn(
        "absolute top-2 left-2 z-[2] max-w-[85%] truncate rounded-[var(--r-chip)] bg-background/95 px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm ring-1 ring-border/50 backdrop-blur-[2px] sm:text-[11px]",
        className,
      )}
    >
      {percentOff}% off
    </span>
  );
}

/**
 * Instant fulfillment — shown in card body (not on photo).
 * Photo overlays are reserved for price/merch; speed reads better next to ratings/price.
 */
export function ProductCardInstantLine({ instant, size = "rail", className }) {
  if (!instant?.enabled) return null;

  const eta = formatInstantCardEta(instant.etaMinutes);
  const showLabel = Boolean(instant.showBadge);
  const label = (instant.badgeLabel || "Instant").trim() || "Instant";

  if (!showLabel && !eta) return null;

  const textClass =
    size === "rail" ? "text-[11px] font-semibold sm:text-xs" : "text-xs font-semibold";

  const parts = [];
  if (showLabel) parts.push(label);
  if (eta) parts.push(eta);

  return (
    <div
      className={cn("flex min-w-0 max-w-[55%] items-center gap-1 text-instant sm:max-w-[62%]", textClass, className)}
      title={
        eta
          ? `${showLabel ? `${label} · ` : ""}${eta} typical arrival after confirmation`
          : label
      }
    >
      <ZapIcon className="size-3 shrink-0 fill-current" aria-hidden />
      <span className="truncate leading-none tabular-nums">{parts.join(" · ")}</span>
    </div>
  );
}

/** @deprecated Use ProductCardInstantLine on card body instead of image overlays. */
export function ProductCardInstantBadge() {
  return null;
}

/** @deprecated Use ProductCardInstantLine. */
export function ProductCardInstantEta(props) {
  return <ProductCardInstantLine {...props} />;
}

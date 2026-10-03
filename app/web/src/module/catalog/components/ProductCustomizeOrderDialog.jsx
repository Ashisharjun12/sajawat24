import { useEffect, useState } from "react";
import { ArrowRightIcon, MinusIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { getLenis } from "@/lib/lenis-instance";
import {
  isAddonAvailable,
  isAddonFree,
} from "@/module/catalog/lib/addon-pricing";

function addonImageSrc(item) {
  return item?.url || item?.publicUrl || item?.optimizedUrl || item?.thumbnailUrl || "";
}

function addonMaxQuantity(addon) {
  const raw = addon?.maxQuantity ?? 1;
  return Math.min(20, Math.max(1, Number(raw) || 1));
}

function discountPercent(pricePaise, compareAtPaise) {
  if (compareAtPaise == null || pricePaise == null || compareAtPaise <= pricePaise) {
    return 0;
  }
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

function AddonColorSwatch({ color, className }) {
  const hex = color?.hex?.trim();
  if (!hex) return null;

  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full ring-2 ring-background shadow-sm",
        className,
      )}
      style={{ backgroundColor: hex }}
      title={color.name || "Color"}
      aria-label={color.name ? `Color: ${color.name}` : "Addon color"}
    />
  );
}

function AddonPrice({ pricePaise, compareAtPaise, available }) {
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  const hasCompare = percentOff > 0;

  if (!available) {
    return (
      <p className="text-xs font-medium text-muted-foreground">
        Not available in your city
      </p>
    );
  }

  if (isAddonFree(pricePaise)) {
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Free</p>
        {compareAtPaise != null && compareAtPaise > 0 ? (
          <span className="text-xs text-muted-foreground line-through tabular-nums">
            {formatPaise(compareAtPaise)}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="text-sm font-extrabold tabular-nums text-foreground">
          {formatPaise(pricePaise)}
        </span>
        {hasCompare ? (
          <span className="text-xs text-muted-foreground line-through tabular-nums">
            {formatPaise(compareAtPaise)}
          </span>
        ) : null}
      </div>
      {hasCompare ? (
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          {percentOff}% OFF
        </span>
      ) : null}
    </div>
  );
}

function AddonQuantityStepper({ value, max, disabled, onChange }) {
  return (
    <div className="mt-auto flex w-full items-center justify-between gap-2 rounded-full border border-border bg-muted/40 p-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-8 shrink-0 rounded-full"
        disabled={disabled || value <= 0}
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <MinusIcon className="size-4" />
      </Button>
      <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{value}</span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-8 shrink-0 rounded-full"
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
}

export function ProductCustomizeOrderDialog({
  open,
  onOpenChange,
  addons = [],
  submitting = false,
  onSkip,
  onProceed,
}) {
  const [qtyById, setQtyById] = useState({});

  useEffect(() => {
    if (open) {
      setQtyById({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const lenis = getLenis();
    lenis?.stop();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open]);

  function setQty(addonId, next) {
    setQtyById((prev) => {
      if (next <= 0) {
        const { [addonId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: next };
    });
  }

  function toggleSingle(addon) {
    if (!isAddonAvailable(addon.pricePaise)) return;
    const on = (qtyById[addon.id] ?? 0) > 0;
    setQty(addon.id, on ? 0 : 1);
  }

  function addMulti(addon) {
    if (!isAddonAvailable(addon.pricePaise)) return;
    const max = addonMaxQuantity(addon);
    const current = qtyById[addon.id] ?? 0;
    if (current === 0) setQty(addon.id, 1);
    else setQty(addon.id, Math.min(max, current + 1));
  }

  const selectedTotal = Object.values(qtyById).reduce((sum, n) => sum + n, 0);

  function buildSelections() {
    return Object.entries(qtyById)
      .filter(([, quantity]) => quantity > 0)
      .map(([addonId, quantity]) => {
        const addon = addons.find((row) => row.id === addonId);
        if (!addon || !isAddonAvailable(addon.pricePaise)) return null;
        const max = addonMaxQuantity(addon);
        return { addonId, quantity: Math.min(max, quantity) };
      })
      .filter(Boolean);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(92dvh,720px)] max-h-[min(92dvh,720px)] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="gap-2 border-b border-border/60 px-5 py-4 text-left sm:px-6">
          <div className="flex items-start gap-3 pr-8">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
              aria-hidden
            >
              <SparklesIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-heading text-lg font-semibold sm:text-xl">
                Customize your order
              </DialogTitle>
              <DialogDescription className="text-sm">
                Add extras to make it special
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch] sm:px-6"
          data-lenis-prevent
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {addons.map((addon) => {
              const src = addonImageSrc(addon.image);
              const available = isAddonAvailable(addon.pricePaise);
              const maxQty = addonMaxQuantity(addon);
              const qty = qtyById[addon.id] ?? 0;
              const isOn = qty > 0;
              const multiQty = maxQty > 1;

              return (
                <article
                  key={addon.id}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card",
                    !available && "opacity-60",
                  )}
                >
                  <div className="relative aspect-square w-full bg-muted">
                    {src ? (
                      <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                      <DecoryImageFallback />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <h3 className="line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-snug sm:text-sm">
                      {addon.name}
                    </h3>
                    <AddonPrice
                      pricePaise={addon.pricePaise}
                      compareAtPaise={addon.compareAtPaise}
                      available={available}
                    />
                    {multiQty && isOn ? (
                      <div className="mt-auto">
                        <AddonQuantityStepper
                          value={qty}
                          max={maxQty}
                          disabled={submitting || !available}
                          onChange={(next) => setQty(addon.id, next)}
                        />
                      </div>
                    ) : null}
                    {!multiQty || !isOn ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={isOn && !multiQty ? "default" : "outline"}
                        className={cn(
                          "mt-auto w-full rounded-full text-xs font-bold",
                          available && !isOn && "border-primary text-primary hover:bg-primary/10",
                        )}
                        disabled={submitting || !available}
                        onClick={() => (multiQty ? addMulti(addon) : toggleSingle(addon))}
                      >
                        {!available
                          ? "Unavailable"
                          : multiQty
                            ? isOn
                              ? "Added"
                              : "+ ADD"
                            : isOn
                              ? "Added"
                              : "+ ADD"}
                      </Button>
                    ) : null}
                    {addon.color?.hex ? (
                      <p className="flex items-center justify-center gap-1.5 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                        <AddonColorSwatch color={addon.color} className="size-3.5" />
                        <span className="truncate font-medium">
                          {addon.color.name || "Color"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
              Selected
            </p>
            <p className="font-heading text-base font-semibold">
              {selectedTotal} add-on{selectedTotal === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={submitting}
              onClick={() => onSkip?.()}
            >
              Skip
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={submitting}
              onClick={() => onProceed?.(buildSelections())}
            >
              {submitting ? "Adding…" : "Proceed to checkout"}
              {!submitting ? <ArrowRightIcon className="size-4" /> : null}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import { GiftIcon, MinusIcon, PlusIcon } from "lucide-react";
import { VIEW_ALL_LINK_CLASS } from "@/module/catalog/components/PdpProductRailHeader";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import {
  addonDiscountPercent,
  addonImageSrcFromAddon,
  addonMaxQuantity,
  buildAddonFilterTabs,
} from "@/module/catalog/lib/addon-selection";
import {
  isAddonAvailable,
  isAddonFree,
} from "@/module/catalog/lib/addon-pricing";

const SCROLL_X =
  "flex min-w-0 w-full gap-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const CARD_WIDTH = "min-w-[9.5rem] w-[9.5rem] sm:min-w-[10.5rem] sm:w-[10.5rem]";

function AddonCardPrice({ pricePaise, compareAtPaise, available }) {
  if (!available) {
    return <p className="text-[11px] font-medium text-muted-foreground">Unavailable</p>;
  }
  if (isAddonFree(pricePaise)) {
    return <p className="text-sm font-bold text-emerald-600">Free</p>;
  }
  const percentOff = addonDiscountPercent(pricePaise, compareAtPaise);
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-sm font-extrabold tabular-nums text-foreground">
        {formatPaise(pricePaise)}
      </p>
      {percentOff > 0 ? (
        <p className="text-[10px] font-semibold text-emerald-600">{percentOff}% OFF</p>
      ) : null}
    </div>
  );
}

function AddonQtyStepper({ value, max, disabled, onChange }) {
  return (
    <div className="flex w-full items-center justify-between gap-1 rounded-full border border-border bg-muted/50 px-1 py-0.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7 shrink-0 rounded-full"
        disabled={disabled || value <= 0}
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <MinusIcon className="size-3.5" />
      </Button>
      <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums">{value}</span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7 shrink-0 rounded-full"
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  );
}

function AddonCard({ addon, qty, disabled, layout, onSetQty, onToggle, onIncrement }) {
  const src = addonImageSrcFromAddon(addon);
  const available = isAddonAvailable(addon.pricePaise);
  const maxQty = addonMaxQuantity(addon);
  const multiQty = maxQty > 1;
  const isOn = qty > 0;

  return (
    <article
      className={cn(
        layout === "grid" ? "min-w-0 w-full" : CARD_WIDTH,
        "flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
        !available && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-full bg-muted">
        {src ? (
          <img src={src} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.35rem] text-[11px] font-semibold leading-snug text-foreground">
          {addon.name}
        </h3>
        <AddonCardPrice
          pricePaise={addon.pricePaise}
          compareAtPaise={addon.compareAtPaise}
          available={available}
        />
        {multiQty && isOn ? (
          <AddonQtyStepper
            value={qty}
            max={maxQty}
            disabled={disabled || !available}
            onChange={(next) => onSetQty(addon.id, next)}
          />
        ) : (
          <Button
            type="button"
            size="sm"
            variant={isOn && !multiQty ? "default" : "outline"}
            className={cn(
              "mt-auto h-8 w-full rounded-full text-xs font-bold",
              available && !isOn && "border-primary text-primary hover:bg-primary/10",
            )}
            disabled={disabled || !available}
            onClick={() => (multiQty ? onIncrement(addon) : onToggle(addon))}
          >
            {!available ? "Unavailable" : isOn && !multiQty ? "Added" : "+ Add"}
          </Button>
        )}
      </div>
    </article>
  );
}

export function ProductPdpAddonsSection({
  addons = [],
  qtyById,
  onSetQty,
  disabled = false,
}) {
  const tabs = useMemo(() => buildAddonFilterTabs(addons), [addons]);
  const [activeTab, setActiveTab] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const visibleAddons = useMemo(
    () => addons.filter((addon) => active.filter(addon)),
    [addons, active],
  );

  if (!addons.length) {
    return null;
  }

  function setQty(addonId, next) {
    onSetQty?.(addonId, next);
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

  const listClass = expanded
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
    : SCROLL_X;

  return (
    <section
      className="rounded-3xl border border-border/80 bg-card px-4 py-4 shadow-sm"
      aria-labelledby="pdp-addons-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-rose-100 text-rose-500 ring-1 ring-rose-200/60 dark:from-sky-950/50 dark:to-rose-950/40 dark:text-rose-400 dark:ring-rose-500/20"
            aria-hidden
          >
            <GiftIcon className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2
              id="pdp-addons-title"
              className="font-heading text-lg font-semibold tracking-tight text-foreground"
            >
              Make it yours
            </h2>
            <p className="text-sm text-muted-foreground">
              Optional extras. Add only what you love.
            </p>
          </div>
        </div>
        {addons.length > 3 ? (
          <button
            type="button"
            className={cn(VIEW_ALL_LINK_CLASS, "border-0 bg-transparent p-0")}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "See all"} →
          </button>
        ) : null}
      </div>

      {tabs.length > 1 ? (
        <div
          className={cn(
            SCROLL_X,
            "mt-4 gap-4 border-b border-border/60 pb-0",
          )}
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={cn(listClass, "mt-4")}>
        {visibleAddons.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            qty={qtyById[addon.id] ?? 0}
            disabled={disabled}
            onSetQty={setQty}
            onToggle={toggleSingle}
            onIncrement={addMulti}
            layout={expanded ? "grid" : "rail"}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Extras are optional — you can skip this
      </p>
    </section>
  );
}
